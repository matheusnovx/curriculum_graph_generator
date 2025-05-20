import json
from pathlib import Path
import graphviz

GRAPH_ATRIBBUTES = """
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
        self.nome = None
        self.sigla_centro = None
        self.codigo_curriculo = None
        self.curriculo = None
        self.disciplinas_obrigatorias = None
        self.disciplinas_nao_obrigatorias = None
        self.disciplinas_por_fase = None
        self.graph = None

    def json_parser(self, json_data):
        """
        Parse the JSON data and return a dictionary with the relevant information.
        """
        self.nome = json_data.get("nome", "")
        self.sigla_centro = json_data.get("sigla_centro", "")

        curriculos = json_data.get("curriculos", [])
        curriculo_key = next(reversed(curriculos))
        self.curriculo = curriculos.get(curriculo_key, [])
        self.codigo_curriculo = self.curriculo.get("codigo", "")

        disciplinas = self.curriculo.get("ucs", [])
        self.disciplinas_obrigatorias = {k: v for k, v in disciplinas.items() if "1" in v["etiquetas"] and "999" != v["fase_sugestao"]}
        self.disciplinas_nao_obrigatorias = {k: v for k, v in disciplinas.items() if "1" not in v["etiquetas"] or "999" == v["fase_sugestao"]}

        self.group_by_fases()

    def create_graph(self):
        """
        Create a graph from the curriculum data.
        """
        self.graph = graphviz.Digraph("curriculo", strict=True)
        self.graph.body.append(GRAPH_ATRIBBUTES)

        with self.graph.subgraph(name="cluster_everything") as cluster:
            cluster.attr(color="#00000000")
            self.create_columns()
            self.create_headers()
            self.create_connections()

        return self.graph


    def group_by_fases(self):
        """
        Group the subjects by their phases.
        """
        fases = {}
        for key, value in self.disciplinas_obrigatorias.items():
            fase = value.get("fase_sugestao", "")
            if fase not in fases:
                fases[fase] = {}
            fases[fase][key] = value

        self.disciplinas_por_fase = fases

    def create_headers(self):
        """
        Create headers for each fase in the graph.
        """
        with self.graph.subgraph() as cluster:
            cluster.attr(color="transparent")
            for fase in sorted(self.disciplinas_por_fase.keys(), key=lambda x: int(x)):
                nome = f"Fase {fase}" if fase != "999" else "Fase 8+"
                self.graph.node(f"header_{fase}", nome,
                                shape="box", style="filled", fillcolor="lightgrey")

    def create_columns(self):
        """
        Create columns for each fase in the graph.
        """
        for fase, disciplinas in sorted(self.disciplinas_por_fase.items(), key=lambda x: int(x[0])):
            header_id = f"header_{fase}"
            prev_node = header_id

            for code, info in disciplinas.items():
                nome = info.get("nome", "")
                self.graph.node(code, label=code, shape="box", style="filled", fillcolor="lightblue")
                self.graph.edge(prev_node, code, style="invis")
                prev_node = code

            with self.graph.subgraph(name=f"cluster_{fase}") as cluster:
                cluster.attr(color="transparent")
                cluster.node(header_id)
                for code in disciplinas:
                    cluster.node(code)

    def create_connections(self):
        """
        Create connections between subjects based on prerequisites.
        """
        for codigo, disciplina in self.disciplinas_obrigatorias.items():
            prereq = disciplina.get("prerequisito", "")
            prereq_list = prereq.split(" e ") if prereq else []
            for prereq_codigo in prereq_list:
                if (prereq_codigo, codigo) == ('MTM3100', 'MTM3110'):
                    self.graph.edge(prereq_codigo, codigo, color="black", constraint="false")
                else:
                    self.graph.edge(prereq_codigo, codigo, color="black")

path = Path("/Users/novais/curriculum_graph_generator/curriculos/ciencias_da_computação/curriculo_208_20242.json")
print(path.resolve())

with open(path, "r") as file:
    curriculum_data = json.load(file)
    generator = CurriculumGraphGenerator()
    generator.json_parser(curriculum_data)
    grafo = generator.create_graph()
    grafo.render(filename = "curriculo", cleanup=True, format="svg", view=False)
    print(grafo)