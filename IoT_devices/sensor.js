//console.log(process.env.ID);

main();


function main() {
  const mqtt = require('mqtt');

  const client = mqtt.connect(
    {
      host: 'mosquitto',
      port: 1883
    }
  );

  let topic = 'temperature';

  // Once connected ...
  client.on('connect', () => {

    console.log('Sensor '+ process.env.ID + ' is now connected to the MQTT broker');

    // Every 10 seconds publish a message to the temperature topic!
    setInterval(() => {
      client.publish(topic, `Hey I am sensor ${process.env.ID}!`, { qos: 0, retain: false }, (error) => {
        if (error) {
          console.error(error);
        }
      });
    }, 10*1000);


  });

}
