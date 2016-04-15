package controllers;

import play.*;
import play.mvc.*;

import org.json.*;

// following are necessary to handle JSON requests and responses
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.NullNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import views.html.*;
import models.*;

import java.util.*;

public class Application extends Controller {

    private static final JsonNodeFactory factory = JsonNodeFactory.instance;

    public static Result test(){
	    return ok(index.render("Test successful."));
    }

    public static Result login() {
        return ok(login.render());
    }
    
    public static Result results() {
    	return ok(results.render(menu.render()));
    }
    
    public static Result graph() {
        return ok(graph.render());
    }

    public static Result authenticate() {
        Http.Session session = Http.Context.current().session();
        JsonNode req = request().body().asJson();
        ObjectNode res = factory.objectNode();
        final String [] expect = {"email", "password"};
        boolean authenticated;

        if(isValidRequest(req, expect) == false) {
            res.put("error", "invalid request");
            return badRequest(res); 
        }

        authenticated = User.authenticate(req.get("email").asText(),
                                          req.get("password").asText());

        if(authenticated == false) {
            res.put("error", "incorrect login");
            return ok(res);
        }

        res.put("status", "ok");
        session.put("email", req.get("email").asText());

        return ok(res);
    }

    public static Result query() throws Exception {
        Query query = new Query();
        Map<String, String[]> form = request().body().asFormUrlEncoded();
        List<Integer> list = query.querySolr(form.get("query")[0]);
        String result = query.queryCourtListener(list);
        return ok(result);
    }

    public static Result getPageRank(String docId){
	//Given docId, retrieves PageRank.
	
	PageRank pageRank = new PageRank();
	String rank = pageRank.getPageRank(docId);
	
	if(rank == null){
		//Not a valid docId.
		return badRequest("invalid doc id");
	}

	return ok(rank);
	
    }


    public static Result findCitations() {
        Query query = new Query();
	    String result = query.findCitations(1724);
    	return ok(result);
    }
	
    public static Result facet(String caseCite, String facetRequest) throws Exception{
	//facetRequest is a comma separated list (no spaces)  of fields which correspond to columns in the supremeCourtData.csv.
	FacetSimilar similar = new FacetSimilar();
	List<String> courtIds = similar.getSimilarCases(caseCite, facetRequest);
	PageRank pageRankUtil = new PageRank();
	List<String> pageRanks = pageRankUtil.getPageRanks(courtIds);

	//Build result:
	JSONObject mainObject = new JSONObject();
	JSONArray jsonArray = new JSONArray();
	for(int i=0; i < courtIds.size(); i++){
		JSONObject temp = new JSONObject();
		temp.put("courtId", courtIds.get(i));
		temp.put("pageRank", pageRanks.get(i));
		jsonArray.put(temp);			
	}
	
	mainObject.put("similarCases", jsonArray);
	return ok(mainObject.toString());
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

    public static Result getSimilar(String courtId) throws Exception{	
	
	Similar similar = new Similar();
	String ids = similar.querySolrForSimilarDocs(courtId);
	System.out.println(ids);
	
	return ok(ids);	
    }
    
    public static Result caseInfo(String caseCite) throws Exception{
	
	return badRequest("deprecated route");
	/*
	System.out.println("Getting info for caseCite: " + caseCite);	
	CaseInfo caseInfo = new CaseInfo();
	String info = caseInfo.getCaseInfo(caseCite);	
	if(info == null){
	   return badRequest("no entry for this caseCite");	
	}else{
	   return ok(info);
	}
	*/
    }

    public static Result addUser() {
        JsonNode req = request().body().asJson();
        ObjectNode res = factory.objectNode();
        final String [] expect = {"email", "password"};
        String email;

        if(isValidRequest(req, expect) == false) {
            res.put("error", "invalid request");
            return badRequest(res); 
        }

        email = req.get("email").asText();

        if(User.exists(email)) {
            res.put("error", "user already exists");
            return ok(res);
        }

        User user = new User(email, req.get("password").asText());
        res.put("status", "ok");

        response().setContentType("application/json");
        return ok(res);
    }

    public static Result getSessions() {
        final Http.Session session = Http.Context.current().session();
        ObjectNode res = factory.objectNode();

        if(session.get("email") == null) {
            res.put("error", "not logged in");
            return ok(res);
        }

        User user = User.find(session.get("email"));

        response().setContentType("application/json");
        return ok(user.getSessions()); 
    }

    public static Result addSession() {
        final Http.Session session = Http.Context.current().session();
        JsonNode req = request().body().asJson();
        ObjectNode res = factory.objectNode();
        final String[] expectedKeys = {"name", "description"};

        if(req == null || !isValidRequest(req, expectedKeys)) {
          res.put("error", "invalid request");
          if(req == null) {
            res.put("error", request().body().asText());
          }
        } else {
          User user = User.find(session.get("email"));

          user.addSession(req.get("name").asText(),
                          req.get("description").asText());

          Thread t = new Thread(new SessionWriter(user));
          t.start();

          res.put("status", "ok");
        }

        response().setContentType("application/json");
        return ok(res);
    }

    public static Result validate() {
        final Http.Session session = Http.Context.current().session();
        ObjectNode res = factory.objectNode();

        if(session.get("email") == null) {
            res.put("error", "user not logged in");
        } else {
            res.put("status", "ok");
        }

        response().setContentType("application/json");
        return ok(res);
    }

    private static boolean isValidRequest(JsonNode request,
                                          String [] keys) {
        if(request == null) {
            return false;
        }
        for(int i = 0; i < keys.length; ++i) {
            if(request.has(keys[i]) == false) {
                return false;
            }
        }
        return true;
    }

 
}
