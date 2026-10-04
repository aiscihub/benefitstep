import {renderOfficialForm} from './form-renderer.mjs';
self.onmessage=async event=>{try{const result=await renderOfficialForm(event.data);self.postMessage({ok:true,result},[result.bytes.buffer]);}catch(error){self.postMessage({ok:false,message:error.message});}};
