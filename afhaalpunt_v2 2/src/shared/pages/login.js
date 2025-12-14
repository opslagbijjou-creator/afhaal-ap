import { login } from "../../core/auth.js";
import { toast } from "../../core/utils.js";

export function renderLogin(root){
  root.innerHTML = `
    <div class="container">
      <div class="card stack">
        <div>
          <div class="brandName">Afhaalpunt</div>
          <div class="brandTag">Scan • Opslaan • Afgeven</div>
        </div>

        <div>
          <div class="label">Email</div>
          <input id="email" class="input" placeholder="naam@bedrijf.nl" autocomplete="username">
        </div>

        <div>
          <div class="label">Wachtwoord</div>
          <input id="password" type="password" class="input" placeholder="••••••••" autocomplete="current-password">
        </div>

        <button class="btn primary" id="loginBtn">Inloggen</button>
        <div class="hint">Gebruik je Firebase account (email + wachtwoord).</div>
      </div>
    </div>
  `;

  document.getElementById("loginBtn").onclick = async () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    try{
      await login(email, password);
    }catch(e){
      toast("Login fout", false);
    }
  };
}
