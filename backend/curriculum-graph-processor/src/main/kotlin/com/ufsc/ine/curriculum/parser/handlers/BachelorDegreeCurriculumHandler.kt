package com.ufsc.ine.curriculum.parser.handlers

import com.ufsc.ine.curriculum.model.CurriculumGraph
import com.ufsc.ine.curriculum.model.Relationship
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.jsonObject

// Handler especializado em currículos de bacharelado que compartilham a mesma estrutura.
class BachelorDegreeCurriculumHandler : BaseCurriculumHandler() {

    override fun canParse(root: JsonObject): Boolean {
        // A condição agora é mais genérica: este handler funciona se a chave "curriculos"
        // existir e contiver pelo menos um currículo.
        val curriculos = root["curriculos"]?.jsonObject
        return curriculos != null && curriculos.isNotEmpty()
    }

    override fun parse(root: JsonObject): List<CurriculumGraph> {
        val curriculosObject = root["curriculos"]!!.jsonObject

        // Itera sobre cada currículo encontrado no JSON (ex: "20001", "20111")
        // e o transforma em um CurriculumGraph.
        return curriculosObject.map { (curriculumId, curriculumJsonElement) ->
            val curriculumJson = curriculumJsonElement.jsonObject
            val ucsJson = curriculumJson["ucs"]!!.jsonObject

            val nodes = ucsJson.mapValues { (_, ucJson) ->
                parseCourseNodeFromUcJson(ucJson.jsonObject) // Reutiliza lógica base
            }

            val relationships = ucsJson.flatMap { (ucId, ucJson) ->
                parseRelationships(ucId, ucJson.jsonObject) // Lógica de parsing das relações
            }

            CurriculumGraph(
                curriculumId = curriculumId,
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