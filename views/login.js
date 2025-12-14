const USERS=[
  {username:'medewerker1',pin:'1111',role:'employee'},
  {username:'moderator1',pin:'2222',role:'moderator'}
];

function renderLogin(){
  app.innerHTML=`
    <div class="card">
      <h1>Inloggen</h1>
      <p>Alleen voor personeel</p>
      <input id="username" placeholder="Gebruikersnaam"/>
      <input id="pin" type="password" placeholder="Pincode"/>
      <button onclick="login()">Inloggen</button>
      <div class="small">medewerker1 / 1111<br/>moderator1 / 2222</div>
    </div>`;
}

function login(){
  const u=document.getElementById('username').value;
  const p=document.getElementById('pin').value;
  const user=USERS.find(x=>x.username===u&&x.pin===p);
  if(!user){alert('Onjuist');return;}
  setSession(user);startApp();
}
