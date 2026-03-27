function login() {
  let email = document.getElementById("email").value.trim();
  let password = document.getElementById("password").value;

  let emailError = document.getElementById("emailError");
  let passwordError = document.getElementById("passwordError");

  emailError.innerText = "";
  passwordError.innerText = "";

  let valid = true;

  // Email validation
  if (email === "") {
    emailError.innerText = "Email is required";
    valid = false;
  } else if (!email.includes("@")) {
    emailError.innerText = "Enter valid email";
    valid = false;
  }

  // Password validation
  if (password === "") {
    passwordError.innerText = "Password is required";
    valid = false;
  } else if (password.length < 8) {
    passwordError.innerText = "Minimum 8 characters required";
    valid = false;
  }

  if (valid) {
    alert("Login Successful 🚀");
    window.location.href = "dashboard.html"; // optional
  }
}

// Show/Hide Password
function togglePassword() {
  let input = document.getElementById("password");
  input.type = input.type === "password" ? "text" : "password";
}