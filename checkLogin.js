window.onload = checkIfLoggedIn();
function showLoginPanel() {
    if (document.getElementById('signIn').style.display == "none") {
        document.getElementById('signIn').style.display = "block";
        document.getElementById('sign-in-btn').textContent = "Close"
    } else {
        document.getElementById('signIn').style.display = "none"
        document.getElementById('sign-in-btn').textContent = "Sign In"
    }
}
function checkIfLoggedIn() {
    if (localStorage.length != 0) {
        document.getElementById('sign-in-btn').style.display = "none"
        document.getElementById('sign-out-btn').style.display = "block"
        if (localStorage.getItem('isAdmin') == 'true') { 
            document.getElementById('deleteBtn').style.display = "block"
            document.getElementById('addBtn').style.display = "block"
            document.getElementById('editBtn').style.display = "block"
        }	
    }
}