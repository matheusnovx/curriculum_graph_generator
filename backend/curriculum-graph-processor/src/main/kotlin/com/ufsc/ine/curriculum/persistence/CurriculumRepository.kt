package com.ufsc.ine.curriculum.persistence

import com.ufsc.ine.curriculum.model.Relationship
import com.ufsc.ine.curriculum.model.CurriculumGraph
import org.neo4j.driver.Driver
import org.neo4j.driver.Values.parameters

class CurriculumRepository(private val driver: Driver) {

    fun saveGraph(graph: CurriculumGraph) {
        // Usar uma transação garante que o grafo seja salvo de forma atômica.
        // Ou tudo é salvo, ou nada é.
        driver.session().use { session ->
            session.writeTransaction { tx ->
                // 1. Cria o nó do currículo usando a CHAVE COMPOSTA
                val curriculumQuery = """
                    MERGE (cur:Curriculum {id: ${'$'}curriculumId, courseCode: ${'$'}courseCode})
                    ON CREATE SET cur.courseName = ${'$'}courseName
                """
                tx.run(
                    curriculumQuery, parameters(
                        "curriculumId", graph.curriculumId,
                        "courseCode", graph.courseCode,
                        "courseName", graph.courseName
                    )
                )

                // 2. Itera para criar todos os nós de curso e ligá-los ao currículo
                val courseQuery = """
                    MERGE (c:Course {courseId: ${'$'}courseId})
                    SET c.name = ${'$'}name, c.description = ${'$'}description, 
                        c.workloadHours = ${'$'}workloadHours, c.suggestedSemester = ${'$'}suggestedSemester,
                        c.etiqueta = ${'$'}etiqueta
                """
                val linkQuery = """
                    MATCH (cur:Curriculum {id: ${'$'}curriculumId})
                    MATCH (c:Course {courseId: ${'$'}courseId})
                    MERGE (c)-[:PART_OF]->(cur)
                """

                graph.nodes.values.forEach { node ->
                    tx.run(
                        courseQuery, parameters(
                            "courseId", node.id,
                            "name", node.name,
                            "description", node.description,
                            "workloadHours", node.workloadHours,
                            "suggestedSemester", node.suggestedSemester,
                            "etiqueta", node.etiqueta
                        )
                    )
                    tx.run(
                        linkQuery, parameters(
                            "curriculumId", graph.curriculumId,
                            "courseId", node.id
                        )
                    )
                }

                // 3. Itera para criar todas as relações entre os cursos
                graph.relationships.forEach { relationship ->
                    val (query, params) = when (relationship) {
                        is Relationship.Prerequisite -> {
                            """
                            MATCH (from:Course {courseId: ${'$'}from}), (to:Course {courseId: ${'$'}to})
                            MERGE (from)-[r:IS_PREREQUISITE_FOR {curriculumId: ${'$'}curriculumId, courseCode: ${'$'}courseCode}]->(to)
                            """ to parameters(
                                "from", relationship.from,
                                "to", relationship.to,
                                "curriculumId", graph.curriculumId, // Passa o ID do currículo para a query
                                "courseCode", graph.courseCode   // Passa o código do curso para a query
                            )
                        }

                        is Relationship.Corequisite -> {
                            "MATCH (from:Course {courseId: ${'$'}from}), (to:Course {courseId: ${'$'}to}) MERGE (from)-[:IS_COREQUISITE_FOR]->(to)" to
                                    parameters("from", relationship.from, "to", relationship.to)
                        }

                        is Relationship.Equivalence -> {
                            // Relação bidirecional sem direção específica
                            "MATCH (from:Course {courseId: ${'$'}from}), (to:Course {courseId: ${'$'}to}) MERGE (from)-[:IS_EQUIVALENT_TO]-(to)" to
                                    parameters("from", relationship.from, "to", relationship.to)
                        }
                    }
                    tx.run(query, params)
                }

                println("Grafo para o currículo ${graph.curriculumId} salvo com sucesso!")
            }
        }
    }
}