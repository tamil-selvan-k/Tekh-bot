           let userInputField=document.getElementById('userInput');
           let intents = {};

           // Load intents.json dynamically
           fetch('./intents.json')
             .then(response => response.json())
             .then(data => {
               intents = data;
             })
             .catch(error => {
               console.error("Error loading intents.json:", error);
             });

          //  function getResponse(userInput) {
          //    userInput = userInput.toLowerCase();
          //    for (let intent of intents.intents){
          //      for (let pattern of intent.patterns){
          //        if (userInput.includes(pattern.toLowerCase())) {
          //           return intent.responses[Math.floor(Math.random() * intent.responses.length)];
          //        }
          //      }
          //    }
          //    return "I'm sorry, I don't understand that. Can you ask something else?";
          //  }
          function levenshteinDistance(s1, s2) {
            let dp = Array(s1.length + 1)
                .fill(null)
                .map(() => Array(s2.length + 1).fill(null));
        
            for (let i = 0; i <= s1.length; i++) dp[i][0] = i;
            for (let j = 0; j <= s2.length; j++) dp[0][j] = j;
        
            for (let i = 1; i <= s1.length; i++) {
                for (let j = 1; j <= s2.length; j++) {
                    const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
                    dp[i][j] = Math.min(
                        dp[i - 1][j] + 1,   // Deletion
                        dp[i][j - 1] + 1,   // Insertion
                        dp[i - 1][j - 1] + cost // Substitution
                    );
                }
            }
            return dp[s1.length][s2.length];
        }
        
        function getResponse(userInput) {
            userInput = userInput.toLowerCase();
            let bestMatch = null;
            let bestDistance = Infinity;
            let threshold = 3; // Max allowable Levenshtein distance for a match
        
            for (let intent of intents.intents) {
                for (let pattern of intent.patterns) {
                    let distance = levenshteinDistance(userInput, pattern.toLowerCase());
                    if (distance < bestDistance) {
                        bestDistance = distance;
                        bestMatch = intent;
                    }
                    // If we find an exact match or a close match, return the response
                    if (distance === 0 || distance <= threshold) {
                        return intent.responses[Math.floor(Math.random() * intent.responses.length)];
                    }
                }
            }
        
            return "I'm sorry, I don't understand that. Can you ask something else?";
        }
        

           
           function sendMessage() {
             const inputField = document.getElementById('userInput');
             let userMessage = inputField.value.trim();
             if (!userMessage) return;
          
             // Get bot's response
             let botReply = getResponse(userMessage);
             
             // Display user's message
             const chatbox = document.getElementById('chatbox');
             const userMsgDiv = document.createElement('div');
             userMsgDiv.className = 'message user';
             userMsgDiv.textContent = userMessage;
             chatbox.appendChild(userMsgDiv);
             chatbox.appendChild(document.createElement("br"));
             
             // Display bot's response
             const botMsgDiv = document.createElement('div');
             botMsgDiv.className = 'message bot';
             
             function typeText(index=0){
              if (index<botReply.length){
                botMsgDiv.textContent+=botReply.charAt(index);
                setTimeout(()=>typeText(index+1),10);
              }
             }
             typeText();
             
             chatbox.appendChild(botMsgDiv);
             chatbox.appendChild(document.createElement("br"));
       
             // Clear input field and scroll to the bottom
             inputField.value = '';
             //chatbox.scrollTop = chatbox.scrollHeight;
             chatbox.scrollIntoView({behaviour: "smooth", block: 'end'});
           }

           userInputField.addEventListener("keydown",function(event){
            if(event.key==="Enter"){
                sendMessage();
            }
           });
            

           function brightTheme(){
            const bright=document.getElementById('bright');
            const body=document.getElementById('body');
            const head=document.getElementById('chat-bot-head');
            body.style.backgroundImage='radial-gradient(#edfd05,#05fde0,#f7ff83)';
            head.style.color='black';
            head.style.textShadow='0 0 5px blue';
           }

           function darkTheme(){
            const dark=document.getElementById('dark');
            const body=document.getElementById('body');
            const head=document.getElementById('chat-bot-head');
            body.style.backgroundImage='radial-gradient(#323f4b,blue,black)';
            head.style.color='#fff';
            head.style.textShadow='0 0 10px #fd053f';
           }

