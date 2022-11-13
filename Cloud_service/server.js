main();

function main(){

  const mqtt = require('mqtt')

  const client = mqtt.connect(
    {
      host: 'mosquitto',
      port: 1883
    }
  );



  client.subscribe('temperature', function (err) {
    if(err){
      exit(err);
    }
    else{
      console.log("The server is now subscribed to the temperature topic!");
    }
  });



  
  client.on('message', function (topic, message) {
    // message is Buffer
    console.log(message.toString())
  });

}
