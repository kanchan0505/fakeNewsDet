function register() {
  let name = document.getElementById("name").value.trim();
  let email = document.getElementById("email").value.trim();
  let password = document.getElementById("password").value;
  let error = document.getElementById("errorMsg");

  let emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (name === "" || email === "" || password === "") {
    error.innerText = "All fields are required!";
    return;
  }

  if (!emailPattern.test(email)) {
    error.innerText = "Enter valid email!";
    return;
  }

  if (password.length < 6) {
    error.innerText = "Password must be at least 6 characters!";
    return;
  }

  error.innerText = "";
  alert("Registration Successful!");

  // redirect to login
  window.location.href = "login.html";
}