package models;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.File;
import java.io.InputStreamReader;
import java.util.*;
import org.json.*;


public class PageRank{

        public static String getPageRank(String docId) {
            System.out.println("Looking for:" + docId);
	    BufferedReader br;
            String path = "/data/solr-5.4.1/pageranks.txt";
            try {
                br = new BufferedReader(new FileReader(path));
                String line;
	
                while((line = br.readLine()) != null) {
			//Split line on ":".
			//temp[0] is docId, temp[1] is PageRank.
			String[] temp = line.split(":");
		
			if(temp[0].equals(docId)){
				
				System.out.println("Found, PageRank is " + temp[1]);
				return temp[1];	
			}
                }

		//If we get here without returning, it's an invalid docId.
		return null;

            }catch(Exception e) {
                e.printStackTrace();
                return "error";
            }
        }
	

}
