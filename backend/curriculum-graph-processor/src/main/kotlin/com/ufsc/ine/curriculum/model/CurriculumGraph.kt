package com.ufsc.ine.curriculum.model

import javax.management.relation.Relation

// A classe principal que representa o grafo completo de um currículo.
data class CurriculumGraph(
    val curriculumId: String,
    val courseCode: Int,
    val courseName: String,
    val nodes: Map<String, CourseNode>,
    val relationships: List<Relationship>,
)