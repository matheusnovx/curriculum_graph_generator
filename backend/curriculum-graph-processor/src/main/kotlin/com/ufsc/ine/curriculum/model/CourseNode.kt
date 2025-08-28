package com.ufsc.ine.curriculum.model

data class CourseNode(
    val id: String,
    val name: String,
    val description: String,
    val workloadHours: Int,
    val suggestedSemester: Int
)
