package controllers;

import play.*;
import play.mvc.*;

import views.html.*;
import models.*;

import java.util.*;

public class Application extends Controller {

    public static Result index() {
        return ok(index.render("Lucem is ready. AJ's Branch"));
    }

    public static Result test(){
	    return ok(index.render("Test successful."));
    }

    public static Result login() {
        return ok(login.render());
    }
    
    public static Result results() {
    	return ok(results.render());
    }
    
    public static Result graph() {
        return ok(graph.render());
    }

    public static Result authenticate() {
        Map<String, String[]> form = request().body().asFormUrlEncoded();
        final String [] expect = {"email", "password"};
        if(isValidRequest(form, expect) == false) {
            return badRequest("bad"); 
        }
        boolean authenticated = User.authenticate(form.get("email")[0],
                                            form.get("password")[0]);
        if(authenticated == false) {
            return ok("incorrect login");
        }

        return ok("logged in");
    }

    public static Result signup() {
        return ok(signup.render());
    }


    public static Result query() throws Exception {
        Query query = new Query();
        Map<String, String[]> form = request().body().asFormUrlEncoded();
        List<Integer> list = query.querySolr(form.get("query")[0]);
        String result = query.queryCourtListener(list);
        return ok(result);
    }

    public static Result findCitations() {
        Query query = new Query();
        String result = query.findCitations(1724);
    	   return ok(result);
    }
     public static Result getDocuments() {
          String[] stringIds;
          Vector<Integer> ids = new Vector<Integer>();
          String result = "";
          String request = request().body().asText();
          if(request == null)
               return badRequest("expected plain text");
          stringIds = request.split(",");
          for(int i = 0; i < stringIds.length; i++) 
               ids.add(Integer.parseInt(stringIds[i]));
          for(int id: ids)
               System.out.println(id);
          try {
               result = Query.queryCourtListener(ids);
          } catch(Exception e) {
               e.printStackTrace();
               return badRequest("Document lookup failed");
          }
          return ok(result);
     }
     
    public static Result testGraph() {
         Random rand = new Random();
         int count = 2;
         int total = 6;
         String obj = "{\"documents\":[";
         for(int i = 0; i < total; i++) {
               obj += "{\"opinions_cited\":[";
               //int citationCount = rand.nextInt(10) + 1;
               for(int j = 0; j < count; j++) {
                    obj += "" + 0;
                    if(j < count - 1) 
                              obj += ",";
               }
               obj += "]";
               obj += ", \"resource_uri\": 0";
               obj += ", \"absolute_url\": \"test/\"}";
               if(i < total - 1)
                    obj += ",";
         }
         obj += "]";
         obj += ",\"initial_count\":" + count + "}";
         return ok(obj);
    }    

    public static Result addUser() {
        Map<String, String[]> form = request().body().asFormUrlEncoded();
        final String [] expect = {"email", "password"};
        String email;
        if(isValidRequest(form, expect) == false) {
            return badRequest("bad"); 
        }
        email = form.get("email")[0];
        if(User.exists(email)) {
            return ok("user already exists");
        }
        User user = new User(email, form.get("password")[0]);
       return ok("created");
    }

    private static boolean isValidRequest(Map<String, String[]> request,
                                          String [] keys) {
        if(request == null) {
            return false;
        }
        for(int i = 0; i < keys.length; ++i) {
            if(request.containsKey(keys[i]) == false) {
                return false;
            }
        }
        return true;
    }

}
