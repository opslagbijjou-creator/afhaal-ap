import { State } from "./state.js";
import { toast } from "./utils.js";

export function stopScanner(){
  if(!State.scanning) return;
  try{
    if(window.Quagga){
      try{ window.Quagga.offDetected(); }catch(e){}
      window.Quagga.stop();
    }
  }catch(e){}
  State.scanning = false;
}

export function startScanner(targetEl, onDetected){
  if(State.scanning) return;
  State.scanning = true;

  if(!window.Quagga){
    toast("Quagga niet geladen", false);
    State.scanning = false;
    return;
  }

  try{ window.Quagga.offDetected(); }catch(e){}

  window.Quagga.init({
    inputStream: { name:"Live", type:"LiveStream", target: targetEl, constraints:{ facingMode:"environment" } },
    locate: true,
    decoder: { readers: ["ean_reader","code_128_reader"] }
  }, (err) => {
    if(err){
      toast("Camera fout", false);
      State.scanning = false;
      return;
    }
    window.Quagga.start();
    window.Quagga.onDetected(onDetected);
    toast("Scanner aan");
  });
}
