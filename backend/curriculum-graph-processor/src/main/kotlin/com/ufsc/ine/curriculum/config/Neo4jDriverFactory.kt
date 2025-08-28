package com.ufsc.ine.curriculum.config

import org.neo4j.driver.AuthTokens
import org.neo4j.driver.Driver
import org.neo4j.driver.GraphDatabase

object Neo4jDriverFactory {
    val driver: Driver by lazy {
        val uri = "neo4j://localhost:7687"
        val user = "neo4j"
        val password = "Matheus2001"
        GraphDatabase.driver(uri, AuthTokens.basic(user, password))
    }
}