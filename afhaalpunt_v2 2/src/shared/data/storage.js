import { DEFAULT_LAYOUT } from "../../core/config.js";

export function getLayout(){
  return JSON.parse(localStorage.getItem("layout") || JSON.stringify(DEFAULT_LAYOUT));
}
export function saveLayout(layout){
  localStorage.setItem("layout", JSON.stringify(layout));
}

export function getPackages(){
  return JSON.parse(localStorage.getItem("packages") || "[]");
}
export function savePackages(arr){
  localStorage.setItem("packages", JSON.stringify(arr));
}

export function getOcc(){
  return JSON.parse(localStorage.getItem("occRPE") || "{}");
}
export function saveOcc(occ){
  localStorage.setItem("occRPE", JSON.stringify(occ));
}
