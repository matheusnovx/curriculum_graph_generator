package com.ufsc.ine.curriculum.parser.handlers

import com.ufsc.ine.curriculum.model.CourseNode
import com.ufsc.ine.curriculum.model.Relationship
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.int
import kotlinx.serialization.json.jsonPrimitive

abstract class BaseCurriculumHandler : CurriculumParserHandler {
    override var next: CurriculumParserHandler? = null

    // Função utilitária que pode ser usada por todas as subclasses.
    protected fun parseCourseNodeFromUcJson(ucJson: JsonObject): CourseNode {
        // Lógica para extrair dados comuns de uma UC.
        val id = ucJson["codigo"]?.jsonPrimitive?.content ?: ""
        val name = ucJson["nome"]?.jsonPrimitive?.content ?: ""
        val workloadHours = ucJson["carga_horaria"]?.jsonPrimitive?.int ?: 0
        val suggestedSemester = ucJson["fase_sugestao"]?.jsonPrimitive?.int ?: 0
        val description = ucJson["ementa"]?.jsonPrimitive?.content ?: ""

        // Use string contains check on raw JSON
        val etiquetasRaw = ucJson["etiquetas"].toString()
        val etiquetaIsOne = etiquetasRaw.contains("\"1\"") || etiquetasRaw.contains("\":\"1\"")


        return CourseNode(
            id = id,
            name = name,
            description = description,
            workloadHours = workloadHours,
            suggestedSemester = suggestedSemester,
            etiqueta = etiquetaIsOne
        )
    }

    // A lógica de parsing das relações (arestas) é deixada para as subclasses,
    // pois é a parte que mais tende a mudar.
    protected abstract fun parseRelationships(ucId: String, ucJson: JsonObject): List<Relationship>
}

