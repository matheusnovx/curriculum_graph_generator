import os
import json
from neo4j import GraphDatabase
from neo4j.exceptions import Neo4jError

# -- CONFIGURAÇÕES --
URI = "neo4j://localhost:7687"
USER = "neo4j"
PASSWORD = "Matheus2001"
PASTA_DADOS = "backend/turmas_20252"

CYPHER_QUERY = """
MATCH (c:Course {courseId: $props.codigo_disciplina})
MERGE (t:Class {
    codigo_disciplina: $props.codigo_disciplina,
    codigo_turma: $props.codigo_turma,
    periodo: $props.periodo
})
ON CREATE SET t = $props
ON MATCH SET t += $props
MERGE (c)-[:OFFERS]->(t)
"""

class Neo4jImporter:
    def __init__(self, uri, user, password):
        try:
            self.driver = GraphDatabase.driver(uri, auth=(user, password))
            self.driver.verify_connectivity()
            print("Conexão com o Neo4j estabelecida com sucesso!")
        except Exception as e:
            print(f"Erro ao conectar com o Neo4j: {e}")
            self.driver = None

    def close(self):
        if self.driver is not None:
            self.driver.close()
            print("Conexão com o Neo4j fechada.")

    def processar_arquivo(self, file_path):
        print("-" * 40)
        print(f"Processando arquivo: {os.path.basename(file_path)}")

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except (json.JSONDecodeError, FileNotFoundError) as e:
            print(f"  [ERRO] Não foi possível ler o arquivo: {e}")
            return

        turmas_data = data.get("turmas")
        if not turmas_data or not isinstance(turmas_data, dict):
            print("  Nenhuma turma encontrada para processar neste arquivo.")
            return

        lista_de_turmas = list(turmas_data.values())
        print(f"  Encontradas {len(lista_de_turmas)} turmas para importar.")

        with self.driver.session() as session:
            for turma in lista_de_turmas:
                horarios = turma.get("sequenciais_horas_ocupadas")
                
                if isinstance(horarios, dict):
                    turma["sequenciais_horas_ocupadas"] = [int(k) for k in horarios.keys()]
                elif horarios is None:
                    turma["sequenciais_horas_ocupadas"] = []

                try:
                    session.run(CYPHER_QUERY, props=turma)
                except Neo4jError as e:
                    print(f"  [ERRO CYPHER] Não foi possível importar a turma '{turma.get('shortname')}'.")
                    print(f"  Motivo: {e.message}")
                    print(f"  Verifique se o curso com courseId='{turma.get('codigo_disciplina')}' já existe no banco.")

        print(f"  Importação do arquivo concluída.")


def main():
    importer = Neo4jImporter(URI, USER, PASSWORD)
    if importer.driver is None:
        return

    if not os.path.isdir(PASTA_DADOS):
        print(f"Erro: A pasta '{PASTA_DADOS}' não foi encontrada.")
        importer.close()
        return

    for filename in os.listdir(PASTA_DADOS):
        if filename.endswith(".json"):
            file_path = os.path.join(PASTA_DADOS, filename)
            importer.processar_arquivo(file_path)

    importer.close()

if __name__ == "__main__":
    main()