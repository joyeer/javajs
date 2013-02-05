package html5;
import html5.annotations.Dom;

@Dom(Object="HTMLElement")
public class HTMLElement {
	
	public String accessKey;
	public String accessKeyLabel;
	public String className;
	public Array dataset;
	public String dir ;
	public String id;
	public String lang;
	public String title;
	
	public native void blur();
	public native void click();
	public native void focus();
}
