package models;
import java.net.URL;
import java.net.HttpURLConnection;
import java.io.BufferedReader;
import java.io.FileReader;
import java.io.File;
import java.io.InputStreamReader;
import java.util.*;
import org.json.*;
import play.Logger;

public class Similar{
	
	public static String querySolrForSimilarDocs(String courtId) throws Exception{
	  	 List<Integer> courtIds = new ArrayList<Integer>();	
	
		
		String endpoint = "http://52.36.127.109:8983/solr/anothaOne_shard1_replica1/mlt?q=courtid:" + courtId +"&mlt.fl=html0_txt_en%2Chtml1_txt_en%2Chtml2_txt_en&mlt.mindf=3&mlt.mintf=3&wt=json&indent=true&mlt.match.include=false&fl=courtid%2Cscore&mlt.interestingTerms=list"; 
		 System.out.println("Solr endpoint queried: " + endpoint);
		 URL url = new URL(endpoint);
                 HttpURLConnection connection = (HttpURLConnection) url.openConnection();
		 connection.setRequestMethod("GET");
		 connection.setRequestProperty("Accept", "application/json");
		 BufferedReader br = new BufferedReader(new InputStreamReader((connection.getInputStream())));                                                                                                               StringBuilder sb = new StringBuilder();

		 String line;
		 while((line=br.readLine()) != null){
			sb.append(line);
		 }
	 		
		courtIds.add(Integer.parseInt(courtId));	

	        JSONObject outerJSON = new JSONObject(sb.toString());
                JSONObject responseJSON = outerJSON.getJSONObject("response");
                JSONArray jsonArray = responseJSON.getJSONArray("docs");
		
		return jsonArray.toString();	

	}


	
}
