package controllers;

import play.*;
import play.mvc.*;

import views.html.*;
import models.*;

public class Application extends Controller {

    public static Result index() {
        return ok(index.render("Lucem is ready. AJ's Branch"));
    }

    public static Result test(){
	    return ok(index.render("Test successful."));
    }

    public static Result login() {
	    String s = "WORK IN PROGRESS";
        return ok(s);
    }

    public static Result signup(String email, String password) {
        User u = new User(email, password);
        return ok("WORK IN PROGRESS");
    }
}
