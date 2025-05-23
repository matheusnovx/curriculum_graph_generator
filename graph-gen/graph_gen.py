import json
from pathlib import Path
import graphviz
import re

GRAPH_ATTRIBUTES = """
// direction of graph layout is left to right
rankdir=LR;
// edges route around nodes with polygonal chains
splines=ortho;
// set transparent background
bgcolor="#00000000";
// set global style for nodes
node [
width=1.4 height=.5 shape=box style=filled
fontname=Arial colorscheme=set36
];
// set global style for edges
edge [style=bold colorscheme=set36 arrowsize=.5 arrowhead=tee];
"""

class CurriculumGraphGenerator:
    def __init__(self):
        self.nome_curso = None
        self.sigla_centro = None
        self.codigo_curriculo = None
        self.curriculo = None
        self.disciplinas_obrigatorias = None
        self.disciplinas_nao_obrigatorias = None
        self.disciplinas_por_fase_mapped = {}
        self.fase_display_keys_sorted = []
        self.node_colors = {}
        self.graph = None

    def _simplify_subject_name(self, name, max_words=2):
        """Creates a simpler, shorter version of the subject name."""
        if not name:
            return ""
        # Remove text in parentheses
        name = re.sub(r'\s*\(.*\)\s*', '', name)
        words = name.split()
        return name


    def json_parser(self, json_data):
        """
        Parse the JSON data and store relevant information.
        """
        self.nome_curso = json_data.get("nome", "")
        self.sigla_centro = json_data.get("sigla_centro", "")

        curriculos = json_data.get("curriculos", {})
        if not curriculos:
            self.curriculo = {}
            self.codigo_curriculo = "unknown_curriculum"
            self.disciplinas_obrigatorias = {}
            self.disciplinas_nao_obrigatorias = {}
            self.group_by_fases()
            return

        curriculo_key = next(reversed(curriculos), None)
        if curriculo_key is None:
            self.curriculo = {}
            self.codigo_curriculo = "unknown_curriculum"
        else:
            self.curriculo = curriculos.get(curriculo_key, {})
        
        self.codigo_curriculo = self.curriculo.get("codigo", f"cur_{curriculo_key or 'default'}")

        disciplinas = self.curriculo.get("ucs", {})
        self.disciplinas_obrigatorias = {
            k: v for k, v in disciplinas.items()
            if "1" in v.get("etiquetas", []) and v.get("fase_sugestao") != "999"
        }
        self.disciplinas_nao_obrigatorias = {
            k: v for k, v in disciplinas.items()
            if "1" not in v.get("etiquetas", []) or v.get("fase_sugestao") == "999"
        }
        self.group_by_fases()

    def group_by_fases(self):
        """
        Group mandatory subjects by their suggested phases, mapping phases >= 8 to "8+".
        Assigns colors to nodes based on their original phase.
        """
        if not self.disciplinas_obrigatorias:
            self.disciplinas_por_fase_mapped = {}
            self.fase_display_keys_sorted = []
            return

        fases_orig_temp = {}

        for key, value in self.disciplinas_obrigatorias.items():
            fase_val = value.get("fase_sugestao", "1")
            fase_str = str(fase_val) 
            value["fase_sugestao_original_str"] = fase_str

            try:
                fase_num_for_color = int(fase_str) 
                color_idx = (fase_num_for_color - 1) % 6 + 1
                self.node_colors[key] = str(color_idx)
            except ValueError:
                self.node_colors[key] = "1"

            if fase_str not in fases_orig_temp:
                fases_orig_temp[fase_str] = {}
            fases_orig_temp[fase_str][key] = value
        
        
        unique_orig_fase_numbers = sorted(list(set(
            int(f_key) for f_key in fases_orig_temp.keys() if str(f_key).isdigit()
        )))

        processed_display_keys = []
        final_mapped_disciplines = {}

        for i in range(1, 8):
            display_key = str(i)
            original_fase_str = str(i)
            if original_fase_str in fases_orig_temp:
                processed_display_keys.append(display_key)
                final_mapped_disciplines[display_key] = fases_orig_temp[original_fase_str]
        
        disciplinas_8_plus = {}
        has_8_plus_content = any(f_num >= 8 for f_num in unique_orig_fase_numbers)
        
        if has_8_plus_content:
            for f_num in unique_orig_fase_numbers:
                if f_num >= 8:
                    original_fase_str = str(f_num)
                    if original_fase_str in fases_orig_temp:
                        disciplinas_8_plus.update(fases_orig_temp[original_fase_str])
            if disciplinas_8_plus:
                processed_display_keys.append("8+")
                final_mapped_disciplines["8+"] = disciplinas_8_plus
        
        self.fase_display_keys_sorted = processed_display_keys
        self.disciplinas_por_fase_mapped = final_mapped_disciplines


    def _create_header_cluster_content(self, parent_cluster):
        """
        Creates the 'cluster_header' with phase labels.
        """
        # TODO: Arranjar um jeito de colocar o header no topo
        if not self.fase_display_keys_sorted:
            return

        with parent_cluster.subgraph(name="cluster_header") as ch:
            ch.attr(color="#00000000")

            for i, phase_key in enumerate(self.fase_display_keys_sorted):
                node_name = f"Fase {phase_key}"
                ch.node(node_name, label=node_name, shape='plaintext', fontsize='16', fontname='Arial-Bold') 
                if i > 0:
                    prev_node_name = f"Fase {self.fase_display_keys_sorted[i-1]}"
                    ch.edge(prev_node_name, node_name, style="invis")

    def _create_phase_clusters_content(self, parent_cluster):
        """
        Creates 'cluster_X' for each phase, containing subject nodes.
        """
        for display_key in self.fase_display_keys_sorted:
            disciplinas_in_phase = self.disciplinas_por_fase_mapped.get(display_key, {})
            if not disciplinas_in_phase:
                continue

            cluster_numeric_id = display_key.replace('+', '')
            with parent_cluster.subgraph(name=f"cluster_{cluster_numeric_id}") as cp:
                cp.attr(color="#00000000")

                sorted_subject_codes = sorted(disciplinas_in_phase.keys())

                for code in sorted_subject_codes:
                    info = disciplinas_in_phase[code]
                    nome_disciplina = info.get("nome", "")
                    label = f"{code}\n{nome_disciplina}"
                    
                    node_color = self.node_colors.get(code, "1")
                    cp.node(code, label=label, color=node_color)


    def _create_connections_content(self):
        """
        Create connections (edges) between subjects based on prerequisites.
        Adds edges to the main graph.
        """
        if not self.disciplinas_obrigatorias:
            return

        for codigo, disciplina in self.disciplinas_obrigatorias.items():
            prereq_field = disciplina.get("prerequisito", "")
            prereq_list = [p.strip() for p in re.split(r'\s+e\s+|\s*,\s*|\s+E\s+', prereq_field) if p.strip()]

            for prereq_codigo in prereq_list:
                if prereq_codigo not in self.disciplinas_obrigatorias and prereq_codigo not in self.disciplinas_nao_obrigatorias:
                    continue

                edge_color = self.node_colors.get(prereq_codigo, "1")

                if (prereq_codigo, codigo) == ('MTM3100', 'MTM3110') or \
                   (prereq_codigo.upper(), codigo.upper()) == ('MTM3100', 'MTM3110'):
                    self.graph.edge(prereq_codigo, codigo, color=edge_color, constraint="false")
                else:
                    self.graph.edge(prereq_codigo, codigo, color=edge_color)
    
    def create_graph(self):
        """
        Create the main graph with all its components.
        """
        # TODO: Deve ser o nome de cada curso, não o mesmo para todos os cursos
        graph_name = "curriculum-graph-compsci-ufsc" # To match target .dot name
        self.graph = graphviz.Digraph(graph_name, strict=True)
        self.graph.body.append(GRAPH_ATTRIBUTES)

        with self.graph.subgraph(name="cluster_everything") as everything_cluster:
            everything_cluster.attr(color="#00000000")
            
            self._create_header_cluster_content(everything_cluster)
            self._create_phase_clusters_content(everything_cluster)
            
        self._create_connections_content()

        return self.graph

path = Path("/Users/novais/curriculum_graph_generator/curriculos/ciencias_da_computação/curriculo_208_20242.json")

with open(path, "r") as file:
    curriculum_data = json.load(file)
    generator = CurriculumGraphGenerator()
    generator.json_parser(curriculum_data)
    grafo = generator.create_graph()
    grafo.render(filename = "curriculo", cleanup=True, format="svg", view=False)
    print(grafo)