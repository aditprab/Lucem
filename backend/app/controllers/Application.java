package controllers;

import play.*;
import play.mvc.*;

import views.html.*;

public class Application extends Controller {

    public static Result index() {
        return ok(index.render("Lucem is ready. AJ's Branch"));
    }

    public static Result test(){
	return ok(index.render("Test successful."));
    }
}
