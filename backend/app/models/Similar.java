package models;

import java.util.*;

public class Similar{
	
	public static List<Integer> querySolrForSimilarDocs(String docId){
		List<Integer> test = new ArrayList<Integer>();	
		test.add(Integer.parseInt(docId));	
		return test;	
	}

}
