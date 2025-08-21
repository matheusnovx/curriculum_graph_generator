import pydot
from neo4j import GraphDatabase
import re
import os

# --- Configuration ---
NEO4J_URI = "bolt://localhost:7687"
NEO4J_USER = "neo4j"
NEO4J_PASSWORD = "Matheus2001" # Make sure this is correct!
DOT_FILE_PATH = "curriculum.dot"

REQUIREMENT_NODES = {"opt1", "opt2", "comp"}

def import_curriculum_data():
    if not os.path.exists(DOT_FILE_PATH):
        print(f"Error: DOT file not found at '{DOT_FILE_PATH}'")
        return

    print("Connecting to Neo4j database...")
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))

    with driver.session(database="neo4j") as session:
        print("Wiping existing data for a fresh import...")
        session.run("MATCH (n) DETACH DELETE n")

        print(f"Parsing '{DOT_FILE_PATH}'...")
        graphs = pydot.graph_from_dot_file(DOT_FILE_PATH)
        main_graph = graphs[0]

        # --- MORE ROBUST FIX IS HERE ---
        top_level_subgraphs = main_graph.get_subgraphs()

        # Debugging: Print what the parser actually sees
        print("\nDEBUG: Found top-level subgraphs with these names:")
        for sg in top_level_subgraphs:
            print(f"  - Name: '{sg.get_name()}'")

        # Flexible search for the container subgraph
        container_subgraph = None
        for sg in top_level_subgraphs:
            # Look for the key name, ignoring quotes or other issues
            if 'cluster_everything' in sg.get_name():
                container_subgraph = sg
                print(f"DEBUG: Successfully identified container as '{sg.get_name()}'\n")
                break # Exit the loop once found

        if not container_subgraph:
            print("FATAL ERROR: Could not find the required 'cluster_everything' subgraph in the DOT file.")
            return
            
        semester_subgraphs = container_subgraph.get_subgraphs()
        # --- END OF FIX ---

        print("--- Importing Nodes ---")
        # (The rest of the script is identical to before)
        for sg in semester_subgraphs:
            match = re.search(r'cluster_(\d+)', sg.get_name())
            if not match:
                continue
            
            fase = int(match.group(1))
            print(f"Processing Fase {fase}...")

            for node in sg.get_nodes():
                code = node.get_name().strip('"')
                attrs = node.get_attributes()
                label = "Requirement" if code in REQUIREMENT_NODES else "Course"
                dot_label = attrs.get('label', code).strip('"')
                name_parts = dot_label.split('\\n')
                name = name_parts[1] if len(name_parts) > 1 else name_parts[0]
                properties = {'code': code, 'name': name, 'fase': fase, 'area_color': attrs.get('color', '0')}
                
                query = f"MERGE (n:{label} {{code: $code}}) SET n += $props"
                session.run(query, code=code, props=properties)
                print(f"  > Merged Node: ({code}:{label})")

        print("\n--- Importing Edges ---")
        for edge in main_graph.get_edges():
            source_code = edge.get_source().strip('"')
            dest_code = edge.get_destination().strip('"')

            if source_code.startswith("Fase ") or dest_code.startswith("Fase "):
                continue

            query = """
            MATCH (prereq:Course {code: $source})
            MATCH (course:Course {code: $dest})
            MERGE (prereq)-[r:IS_PREREQUISITE_FOR]->(course)
            """
            session.run(query, source=source_code, dest=dest_code)
            print(f"  > Merged Edge: ({source_code}) -> ({dest_code})")

    driver.close()
    print("\nImport complete! Your curriculum graph is ready in Neo4j.")

if __name__ == "__main__":
    import_curriculum_data()