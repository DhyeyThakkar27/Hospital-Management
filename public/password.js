function passwordCheck(){
    var password = prompt("Please enter the password.");
    if (password==="ilikepie"){
        window.location="realpage.html";
    } else if (password!='' && password!=null) {
        while(password !=="ilikepie"){
            password = prompt("Please enter the password.");
        }
        window.location="realpage.html";
    }
}
window.onload=passwordCheck;