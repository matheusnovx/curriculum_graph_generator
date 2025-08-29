package com.ufsc.ine.curriculum.parser.handlers

import com.ufsc.ine.curriculum.model.CurriculumGraph
import com.ufsc.ine.curriculum.model.Relationship
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.int
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.jsonObject

// Handler especializado em currículos de bacharelado que compartilham a mesma estrutura.
class BachelorDegreeCurriculumHandler : BaseCurriculumHandler() {

    override fun canParse(root: JsonObject): Boolean {
        val curriculos = root["curriculos"]?.jsonObject
        return curriculos != null && curriculos.isNotEmpty()
    }

    override fun parse(root: JsonObject): List<CurriculumGraph> {
        val courseCode = root["codigo"]!!.jsonPrimitive.int
        val courseName = root["nome"]!!.jsonPrimitive.content

        val curriculosObject = root["curriculos"]!!.jsonObject

        return curriculosObject.map { (curriculumId, curriculumJsonElement) ->
            val curriculumJson = curriculumJsonElement.jsonObject
            val ucsJson = curriculumJson["ucs"]!!.jsonObject
            // todo: Curriculo 19911 de comp n tem UC

            val nodes = ucsJson.mapValues { (_, ucJson) ->
                parseCourseNodeFromUcJson(ucJson.jsonObject)
            }

            val relationships = ucsJson.flatMap { (ucId, ucJson) ->
                parseRelationships(ucId, ucJson.jsonObject)
            }

            CurriculumGraph(
                curriculumId = curriculumId,
                courseCode = courseCode,
                courseName = courseName,
                nodes = nodes,
                relationships = relationships
            )
        }
    }

    override fun parseRelationships(ucId: String, ucJson: JsonObject): List<Relationship> {
        val relationships = mutableListOf<Relationship>()

        val prereqString = ucJson["prerequisito"]?.jsonPrimitive?.content
        if (!prereqString.isNullOrBlank()) {
            val prereqIds = prereqString.split(" e ", " ou ", " E ", " OU ")
            prereqIds.forEach { prereqId ->
                if (prereqId.isNotBlank()) {
                    relationships.add(Relationship.Prerequisite(from = prereqId.trim(), to = ucId))
                }
            }
        }

        // TODO: ... Lógica para correquisito e equivalencia ...

        return relationships
    }
}