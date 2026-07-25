package com.athletex.ui.model

data class MenuItem(
    val title: String,
    val description: String,
    val iconRes: Int,
    val destinationClass: Class<*>
)
