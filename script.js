// Supabase connection
const supabaseUrl = 'https://hztuefczqcwvvcsgfqhv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6dHVlZmN6cWN3dnZjc2dmcWh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMDk2MDMsImV4cCI6MjA5Nzc4NTYwM30.loj8W0G_MuqsneSdjZFfTc6B6h9dUmWzqoUzjuQx1Ec';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

//detect un-btn click
document.addEventListener('DOMContentLoaded', function(){

    // Feedback
const feedbackBtn = document.getElementById('feedback-btn');
const feedbackBox = document.getElementById('f-box');
const feedbackStatus = document.querySelector('.feedback-status');

feedbackBtn.addEventListener('click', async function() {
    const message = feedbackBox.value.trim();
    const username = localStorage.getItem('keyname') || 'Anonymous';

    if (message === "") {
        feedbackStatus.textContent = "⚠️ Please type a message";
        feedbackStatus.style.color = "#ff4444";
        return;
    }

    const { error } = await supabaseClient
        .from('feedback')
        .insert([{ username: username, message: message }]);

    if (error) {
        feedbackStatus.textContent = "⚠️ Failed to send. Try again.";
        feedbackStatus.style.color = "#ff4444";
        console.error(error);
        return;
    }

    feedbackStatus.textContent = "✅ Thank you for your feedback!";
    feedbackStatus.style.color = "#d5ff40";
    feedbackBox.value = "";
});

    // Load leaderboard from Supabase
    async function loadLeaderboard() {
        const { data, error } = await supabaseClient
            .from('players')
            .select('username, wins')
            .order('wins', { ascending: false })
            .limit(10);

        if (error) {
            console.error('Error loading leaderboard:', error);
            return;
        }

        const tbody = document.querySelector('.table-body');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;padding:20px;color:#666;">No players yet</td></tr>';
            return;
        }

        data.forEach((player, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${player.username}</td>
                <td>${player.wins}</td>
            `;
            tbody.appendChild(row);
        });
    }
    // Load leaderboard on page load
    loadLeaderboard();

    const savedName3 = localStorage.getItem('keyname');
    if (savedName3) {
        const displayUn = document.getElementById('display-un');
        if (displayUn) {
            displayUn.textContent = savedName3;
        }
    }

    //home-page -> game setup
const setUsernameBtn = document.querySelector('.un-btn');
const usernameInput = document.querySelector('.un');
const msgEl = document.getElementById('username-msg'); // Make sure <p id="username-msg"></p> exists in your HTML near the username input

setUsernameBtn.addEventListener('click', async function(){
    const typedName = usernameInput.value;
    const cleanName = typedName.trim();

    if (cleanName === ""){
        if (msgEl) msgEl.textContent = "⚠️ Please enter a username";
        return;
    }

    // Check if username exists in Supabase
    // Using .maybeSingle() instead of .single() so a "no match" (username available)
    // doesn't come back as a 406 error - it just returns data: null cleanly.
    const { data, error } = await supabaseClient
        .from('players')
        .select('username')
        .eq('username', cleanName)
        .maybeSingle();

    if (error) {
        if (msgEl) msgEl.textContent = "⚠️ Something went wrong checking the username.";
        console.error('Error checking username:', error);
        return;
    }

    if (data) {
    // Username exists → log them in
    localStorage.setItem('keyname', cleanName);

    const homePage = document.querySelector('.home-page');
    const gameSetup = document.querySelector('.game-setup');

    if (homePage && gameSetup) {
        homePage.style.display = 'none';
        gameSetup.style.display = 'block';
    }

    const displayUn = document.getElementById('display-un');
    if (displayUn) displayUn.textContent = cleanName;

    if (msgEl) msgEl.textContent = "✅ Welcome back, " + cleanName + "!";
    return;
}

    // Save to localStorage
    localStorage.setItem('keyname', cleanName);

    // Insert new player into Supabase
    const { error: insertError } = await supabaseClient
        .from('players')
        .insert([{ username: cleanName, wins: 0 }]);

    if (insertError) {
        if (msgEl) msgEl.textContent = "⚠️ Something went wrong. Please try again.";
        console.error(insertError);
        return;
    }

    if (msgEl) msgEl.textContent = "";

    const homePage = document.querySelector('.home-page');
    const gameSetup = document.querySelector('.game-setup');

    if(homePage && gameSetup){
        homePage.style.display = 'none';
        gameSetup.style.display = 'block';
    }

    // Update username display
    const displayUn = document.getElementById('display-un');
    if (displayUn) displayUn.textContent = cleanName;
});
console.log("Set username button found:", setUsernameBtn);
console.log("Username input found:", usernameInput);
console.log("msgEl found:", msgEl);



    //game-setup -> game page
    const dropDownSelect = document.querySelector('#dropdown-digit');    //dropdown menu
    const repeatSelector = document.querySelector('.radio-btn');      //radio button
    const startButton = document.querySelector('.submit-btn');  //start game button


    // game setup function(start button)
    startButton.addEventListener('click', function(){
        const dropValue = dropDownSelect.value;
        let repeatValue=null;
        const radioButtons=document.querySelectorAll('input[name="yes/no"]');
        for(let i=0;i<radioButtons.length;i++){
            if(radioButtons[i].checked){
                repeatValue=radioButtons[i].value;
                break;
            }
        }

        if(repeatValue===null){
            alert("Please select YES or NO for digit repeats");
            return;
        }

        const digitCount =parseInt(dropValue);
        const savedName = localStorage.getItem('keyname');
        if (savedName) {
            document.getElementById('display-un').textContent = savedName;
        }

        localStorage.setItem('digitCount', digitCount);   //store digit count
        localStorage.setItem('repeatValue',repeatValue==='yes');     //store repeat value


        // secret code generation logic

        let secretCode;
        if(repeatValue=== "yes"){
            secretCode=[];
            let counter=0;
            for(let i=0;i<digitCount-1;i++){
                let digit=Math.floor(Math.random()*10);
                secretCode.push(digit);
                counter++;
            }
            let r_index=Math.floor(Math.random()*(digitCount-1));
            let repeat_d=secretCode[r_index];
            secretCode.push(repeat_d);
        }
        else{
            let allDigits=[0,1,2,3,4,5,6,7,8,9];
            for(let i=allDigits.length-1;i>0;i--){
                let j=Math.floor(Math.random()*(i+1));
                [allDigits[i],allDigits[j]]=[allDigits[j],allDigits[i]];
            }
            secretCode=allDigits.slice(0,digitCount);  
        }

        console.log("Secret code:", secretCode);
        localStorage.setItem('secretCode',JSON.stringify(secretCode));

        let aDisplay="";     //update * display on game page
        for(let i=0;i<digitCount;i++){
            aDisplay+="* ";
        }
        document.getElementById('secret-display').textContent = aDisplay.trim();

        let inputfield=document.getElementById('secret-inputb');
        if(inputfield){
            inputfield.placeholder=`Enter ${digitCount} digits` ;
        }
        
        document.getElementById('display-digit').textContent=digitCount;
        document.getElementById('display-repeat').textContent=(repeatValue==="yes")?"Yes":"No";

        const gameSetup = document.querySelector('.game-setup');  //get game setup page
        const gamePage = document.querySelector('.game-page');   //get game page

        console.log("game setup page found", gameSetup);   //check if game setup page exists
        console.log("game page found", gamePage);   //check if game page exists

        if(gamePage && gameSetup){     //both have to exist so AND condition
            gameSetup.style.display='none';   //hide setup page after user clicks 'submit'
            gamePage.style.display='block';  //display blank game page
            
            // Show username on game page
            const savedName = localStorage.getItem('keyname');
            if (savedName) {
                document.getElementById('game-display-un').textContent = savedName;
            }
        }

        // game page elements
        const submitBtn=document.querySelector('.submit-game');
        const guessInp=document.querySelector('#secret-inputb');
        const feedbackTxt=document.querySelector('#feedback-text');
        const attemptSpan=document.querySelector('#attempt-cnt');
        const historyList=document.querySelector('#history-list');

        //game state variables
        let currentSecCode=[];
        let attempts=0;
        let gameActive=true;

        currentSecCode=secretCode;
        attempts=0;
        attemptSpan.textContent=attempts;
        gameActive=true;
        feedbackTxt.textContent="";
        historyList.innerHTML="";

        //game logic(submit button)
        submitBtn.addEventListener('click', async function(){
            if(!gameActive){
                feedbackTxt.textContent="Game over! Press New Game to play again";
                return;
            }
            const guessValue=guessInp.value.trim();
            if(guessValue===""){
                feedbackTxt.textContent="Please enter your guess";
                return;
            }
            if(!/^\d+$/.test(guessValue)){
                feedbackTxt.textContent="Only numbers are allowed";
                return;
            }
            if(guessValue.length !== digitCount){
                feedbackTxt.textContent=`Enter exact ${digitCount} digits`;
                return;
            }

            const guessArray=guessValue.split('').map(Number);
            let correctPos=[];
            for(let i=0;i< digitCount;i++){
                if(guessArray[i]===currentSecCode[i]){
                    correctPos.push(i+1);
                }
            }

            let feedbackMsg="";
            if (correctPos.length === digitCount) {
                feedbackMsg = "Code Cracked!! You won!";
                gameActive = false;
    
                // Update Supabase
                const username = localStorage.getItem('keyname');
                if (username) {
                    try {
                        const { data: playerData } = await supabaseClient
                        .from('players')
                        .select('wins')
                        .eq('username', username)
                        .maybeSingle();
            
                        const currentWins = playerData?.wins || 0;
            
                        await supabaseClient
                            .from('players')
                            .upsert({
                                username: username,
                                wins: currentWins + 1
                            }, { onConflict: 'username' });
            
                        loadLeaderboard();
                        } catch (err) {
                            console.error('Error updating wins:', err);
                        }
                }
            }
            else if(correctPos.length===0){
                feedbackMsg="No digits in correct position";
            }
            else{
                feedbackMsg=`Correct Position ${correctPos.length>1?"'s":''} ${correctPos.join(', ')} correct`;
            }
            feedbackTxt.textContent=feedbackMsg;
            attempts++;
            attemptSpan.textContent=attempts;

            const historyEntry=document.createElement('div');
            historyEntry.style.padding="8px";
            historyEntry.style.borderBottom = "1px solid #2a2a2a";
            historyEntry.style.fontFamily = "monospace";
            historyEntry.innerHTML=`#${attempts}:${guessValue} -> ${feedbackMsg}`;
            historyList.appendChild(historyEntry);

            const historyContainer=document.querySelector('.guess-history');
            if(historyContainer){
                historyContainer.scrollTop=historyContainer.scrollHeight;
            }
            guessInp.value="";

            if(!gameActive){
                feedbackTxt.textContent="Code Cracked!! Press New Game to play again!";
            }
            
        });
        

        //give-up button
        const giveUpBtn=document.querySelector('.give-up');
        giveUpBtn.addEventListener('click',function(){
            if(!gameActive){
                feedbackTxt.textContent="Game Over Already!";
                return;
            }
            const codeString=currentSecCode.join(' ');
            feedbackTxt.textContent=`You gave up. Secret code was ${codeString}`;
            gameActive=false;
        });

        //new game button
        const newGameBtn = document.querySelector('.new-game');
        newGameBtn.addEventListener('click', function() {
            const gameSetup = document.querySelector('.game-setup');
            const gamePage = document.querySelector('.game-page');
    
            if (gameSetup && gamePage) {
            gamePage.style.display = 'none';
            gameSetup.style.display = 'block';
            }
        });

    });

    

});