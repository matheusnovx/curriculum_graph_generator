import json
import re
from collections import defaultdict
from pathlib import Path
import graphviz
import os

SUBJECT_CODE_REGEX = re.compile("[A-Z]{3}[0-9]{4}")

VALID_COLORS = ["1", "2", "3", "4", "5", "6"]

LAYOUT = """
    // Direção do layout do grafo é da esquerda para a direita
    rankdir=LR;

    // As arestas contornam os nós com cadeias poligonais
    splines=ortho;

    // Define o fundo transparente
    bgcolor="#00000000";

    // Define o estilo global para os nós
    node [
        width=1.4 height=.5 shape=box style=filled
        fontname=Arial colorscheme=set36
    ];

    // Define o estilo global para as arestas
    edge [style=bold colorscheme=set36 arrowsize=.5 arrowhead=tee];
"""

class GraphGenerator:
    """
    Gera um grafo de currículo a partir de dados JSON, com ajustes no layout
    para se aproximar do segundo exemplo.
    """
    def __init__(self, json_data):
        self.raw_data = json_data
        self.curriculum_data = {}
        self.node_colors = {}
        self.all_subjects = {}
        self.fase_keys_sorted = []
        self._load_and_process_data()

    def _load_and_process_data(self):
        """
        Carrega e processa os dados JSON para a estrutura necessária,
        agrupando por fases e definindo cores.
        """
        curriculos = self.raw_data.get("curriculos", {})
        if not curriculos:
            print("Nenhum currículo encontrado no JSON.")
            return

        # Pega a última chave (geralmente a mais recente ou a única relevante)
        # Se houver múltiplas chaves e você quiser uma específica, ajuste aqui.
        curriculo_key = next(reversed(curriculos), None)
        print(f"Usando currículo: {curriculo_key}")
        curriculo = curriculos.get(curriculo_key, {})
        disciplinas = curriculo.get("ucs", {})

        obrigatorias = {
            k: v for k, v in disciplinas.items()
            if "1" in v.get("etiquetas", []) and v.get("fase_sugestao") != "999"
        }
        self.all_subjects = obrigatorias
        print(f"Encontradas {len(obrigatorias)} disciplinas obrigatórias.")

        fases_temp = defaultdict(list)
        fase_numbers = set()

        for code, data in obrigatorias.items():
            fase_val = data.get("fase_sugestao", "1")
            try:
                fase_num = int(fase_val)
                fase_numbers.add(fase_num)
                display_key = str(fase_num)
                
                subject_info = {
                    "codigo": code,
                    "nome": data.get("nome", ""),
                    "prerequisito": data.get("prerequisito", ""),
                    "descricao": data.get("nome", ""),
                    "fase_original": fase_num
                }
                fases_temp[display_key].append(subject_info)

                color_idx = (fase_num - 1) % len(VALID_COLORS)
                self.node_colors[code] = VALID_COLORS[color_idx]
            except ValueError:
                print(f"Aviso: Fase '{fase_val}' para a disciplina '{code}' não é um número. Ignorando.")


        sorted_numeric = sorted([k for k in fases_temp.keys() if k.isdigit()], key=int)
        self.fase_keys_sorted = sorted_numeric
        if "8+" in fases_temp:
            self.fase_keys_sorted.append("8+")

        print(f"Fases processadas: {self.fase_keys_sorted}")

        for key in self.fase_keys_sorted:
            self.curriculum_data[key] = sorted(fases_temp[key], key=lambda x: x["codigo"])


    def _get_subject_label(self, subject: dict):
        """
        Cria a etiqueta do nó com quebra de linha para nomes longos.
        """
        subject_parts = []
        name = subject.get("nome", "")
        for word in name.split():
            if not subject_parts:
                subject_parts.append(word)
                continue
            if len(subject_parts[-1]) + len(word) < 15:
                subject_parts[-1] += " " + word
            else:
                subject_parts.append(word)
        subject_name = "\n".join(subject_parts)
        subject_code = subject["codigo"]
        return f"{subject_code}\n\n{subject_name}"

    def _get_subject_color(self, subject: dict):
        """
        Retorna a cor pré-calculada para a disciplina.
        """
        return self.node_colors.get(subject["codigo"], "1")

    def _create_headers(self, graph: graphviz.Graph):
        """
        Cria os cabeçalhos de fase como nós 'plaintext' e os conecta invisivelmente.
        """
        with graph.subgraph(name="cluster_header") as cluster_h:
            cluster_h.attr(color="#00000000")
            # rank='min' pode não funcionar bem com rankdir=LR, mas tentamos
            cluster_h.attr(rank="min") 

            header_nodes = []
            for key in self.fase_keys_sorted:
                node_name = f"Fase {key}"
                header_nodes.append(node_name)
                cluster_h.node(node_name, label=node_name, shape='plaintext', fontsize='16', fontname='Arial-Bold')

            for i in range(len(header_nodes) - 1):
                cluster_h.edge(header_nodes[i], header_nodes[i+1], style="invis")
        
        return header_nodes

    def _create_columns(self, graph: graphviz.Graph, header_nodes: list):
        """
        Cria os subgrafos (colunas) para cada fase com suas disciplinas.
        """
        all_first_nodes = []
        for i, phase_key in enumerate(self.fase_keys_sorted):
            subjects = self.curriculum_data.get(phase_key, []) # Use .get for safety
            if not subjects: 
                all_first_nodes.append(None) # Mantém correspondência
                continue

            cluster_id = phase_key.replace('+', '_plus')
            with graph.subgraph(name=f"cluster_{cluster_id}") as cluster_c:
                cluster_c.attr(color="#00000000")

                phase_nodes = []
                for subject in subjects:
                    label = self._get_subject_label(subject)
                    color = self._get_subject_color(subject)
                    tooltip = subject["descricao"]
                    code = subject["codigo"]
                    cluster_c.node(code, label=label, color=color, tooltip=tooltip)
                    phase_nodes.append(code)
                
                if phase_nodes:
                    all_first_nodes.append(phase_nodes[0])
                else:
                    all_first_nodes.append(None)

        # Conecta invisivelmente o header ao primeiro nó de cada coluna
        # Usa lhead e ltail para apontar para os clusters, o que pode ajudar
        for i, (header, first_node) in enumerate(zip(header_nodes, all_first_nodes)):
            if first_node:
                phase_key = self.fase_keys_sorted[i]
                cluster_id = phase_key.replace('+', '_plus')
                # Aresta invisível com peso, apontando para o cluster (lhead)
                # E para o nó (first_node) - isso pode ser redundante, mas testa
                graph.edge(header, first_node, style="invis", weight="1000", lhead=f"cluster_{cluster_id}")


    def _create_connections(self, graph: graphviz.Graph):
        """
        Cria as arestas (conexões) entre as disciplinas com base nos pré-requisitos.
        """
        all_codes = set(self.all_subjects.keys())

        for subjects_list in self.curriculum_data.values():
            for subject in subjects_list:
                prereq_field = subject.get("prerequisito", "")
                prereq_list = SUBJECT_CODE_REGEX.findall(prereq_field)

                for prereq_code in prereq_list:
                    if prereq_code not in all_codes:
                        # print(f"Aviso: Pré-requisito '{prereq_code}' para '{subject['codigo']}' não encontrado nas obrigatórias.")
                        continue

                    color = self.node_colors.get(prereq_code, "1")
                    
                    # Usa ltail e lhead para tentar guiar as arestas entre clusters
                    # Pega a fase do prereq e do subject para achar os clusters
                    prereq_phase_key = None
                    subject_phase_key = None

                    for key, s_list in self.curriculum_data.items():
                        if any(s['codigo'] == prereq_code for s in s_list):
                            prereq_phase_key = key.replace('+', '_plus')
                        if any(s['codigo'] == subject['codigo'] for s in s_list):
                            subject_phase_key = key.replace('+', '_plus')
                        if prereq_phase_key and subject_phase_key:
                            break

                    attrs = {'color': color}
                    if prereq_phase_key:
                        attrs['ltail'] = f"cluster_{prereq_phase_key}"
                    if subject_phase_key:
                        attrs['lhead'] = f"cluster_{subject_phase_key}"

                    if (prereq_code.upper(), subject["codigo"].upper()) == ('MTM3100', 'MTM3110'):
                        attrs['constraint'] = "false"
                        graph.edge(prereq_code, subject["codigo"], **attrs)
                    else:
                        graph.edge(prereq_code, subject["codigo"], **attrs)


    def generate_graph(self) -> graphviz.Digraph:
        """
        Gera o objeto Digraph final.
        """
        graph = graphviz.Digraph("grafo_materias_layout_ajustado", strict=True)
        graph.body.append(LAYOUT)
        graph.attr(compound='true')

        header_nodes = self._create_headers(graph)
        self._create_columns(graph, header_nodes)

        self._create_connections(graph)

        return graph

# Use the parent directory to get the correct path
project_root = Path(__file__).parent.parent
path = project_root / "curriculos/ciencias_da_computação/curriculo_208_20242.json"

# Ensure the output directory exists
output_dir = project_root / "graph-gen/grafos_gerados"
output_dir.mkdir(parents=True, exist_ok=True)

with open(path, "r", encoding='utf-8') as file:
    curriculum_data = json.load(file)

    generator = GraphGenerator(curriculum_data)
    grafo = generator.generate_graph()

    output_filename = output_dir / "grafo_curriculo"
    # Tenta usar o motor 'dot' (padrão) ou 'neato'/'fdp' se quiser experimentar
    grafo.engine = 'dot' 
    grafo.render(filename=output_filename, cleanup=True, format="svg", view=False)

    with open(f"{output_filename}.dot", "w", encoding='utf-8') as dot_file:
        dot_file.write(grafo.source)