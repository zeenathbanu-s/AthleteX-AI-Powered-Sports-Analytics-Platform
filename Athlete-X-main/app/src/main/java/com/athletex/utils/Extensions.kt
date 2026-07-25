package com.athletex.utils

import android.content.Context
import android.widget.Toast
import androidx.fragment.app.Fragment

fun Context.showToast(message: String, duration: Int = Toast.LENGTH_SHORT) {
    Toast.makeText(this, message, duration).show()
}

fun Fragment.showToast(message: String, duration: Int = Toast.LENGTH_SHORT) {
    requireContext().showToast(message, duration)
}

fun Double.formatToDecimalPlaces(places: Int): String {
    return "%.${places}f".format(this)
}

fun String.isValidEmail(): Boolean {
    return android.util.Patterns.EMAIL_ADDRESS.matcher(this).matches()
}

fun String.isValidPhoneNumber(): Boolean {
    return this.matches(Regex("^[+]?[0-9]{10,15}$"))
}
