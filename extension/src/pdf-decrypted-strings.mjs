// The PDF library hands back the strings of a protected form as raw bytes once it has removed the protection, without
// the backslash a PDF needs before "(", ")", "\" and a carriage return. English labels rarely hold those bytes.
// Translated ones do: many Chinese and Vietnamese characters contain them. The saved copy then breaks in a strict
// viewer, and the in-app preview drew such a form as scrambled letters. Importing this module puts the backslashes
// back as each string is read, which is what the library does for a form that was never protected.
import {PDFObjectParser,PDFString} from '../vendor/pdf-writer/pdf-lib.mjs';
const read=PDFObjectParser.prototype.parseString;
if(!read.escapesDecrypted){
 const escaped=function(ref){const string=read.call(this,ref);return this.cryptoFactory&&ref?PDFString.of(string.asString().replace(/[\\()\r]/g,c=>c==='\r'?'\\r':'\\'+c)):string;};
 escaped.escapesDecrypted=true;PDFObjectParser.prototype.parseString=escaped;
}
