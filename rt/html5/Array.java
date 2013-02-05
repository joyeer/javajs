package html5;

import html5.annotations.JsMethod;
import html5.annotations.JsType;

@JsType(type="Array")
public class Array {
	@JsMethod(name="concat")
	public native Array concat(Object obj);
}
