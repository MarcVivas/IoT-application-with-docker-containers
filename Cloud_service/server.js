const mqtt = require('mqtt')
const mongoose = require('mongoose');
const kafka = require("kafka-node");
const nodePickle = require('node-pickle');

const Sensor = mongoose.model('Sensor', new mongoose.Schema(
        {
            _id: String,        // ID of the sensor
            temperatures: [
                {
                    _id: Number,
                    temperature: Number,
                    collected_at: Date
                }
            ],
        }
));


const ModelPrediction = mongoose.model('Model_predictions', new mongoose.Schema(
    {
        _id: String,            // ID of the sensor
        predictions: [
            {
                _id: Number,
                date: Date,
                y_hat: Number,
                y_hat_lower: Number,
                y_hat_upper: Number
            }
        ],
    }
));



main();

function main(){

    //================================================================
    // Set up

    // Connect to the database
    mongoose.connect('mongodb://admin:1234@mongo:27017/server?authSource=admin');

    // Connect to the mqtt broker
    const mqttClient = mqtt.connect(
        {
            host: 'mosquitto',
            port: 1883
        }
    );

    // Connect to Kafka
    const kafkaClient = new kafka.KafkaClient({kafkaHost: "kafka:9092"});
    //================================================================

    // Once connected...
    mqttClient.on('connect', function (){
        // Connected!
        console.log("The server is now connected to the MQTT broker!");

        // Subscribe to the temperature topic
        mqttClient.subscribe('temperature', subscribeCallback);

        const kafkaClientForTheProducer = new kafka.KafkaClient({kafkaHost: "kafka:9092"});
        const kafkaProducer = new kafka.Producer(kafkaClientForTheProducer);

        // Listen to the broker
        mqttClient.on('message', processMQTTMessage(kafkaProducer));

    });

    // Once connected and ready...
    kafkaClient.on('ready', () => {
        console.log("The server is now waiting for the results of the analysis!");
        const kafkaConsumer = new kafka.Consumer(kafkaClient, [{topic: 'analytics_results'}]);
        kafkaConsumer.on('message', processKafkaMessage);
    });



}

/**
 * The returned function is executed when the server receives a new message from the MQTT broker.
 * Saves the received data in the database.
 * Sends the received data to the analytics module.
 * @param kafkaProducer
 * @return function
 */
function processMQTTMessage(kafkaProducer){
    return (topic, message) => {
        // Message received :)

        // Get json
        const data = JSON.parse(message.toString());

        console.log("Server: Message received from sensor " + data.sensorId);

        // Create if it doesn't exist or update if it exists
        Sensor.findOneAndUpdate(
            {_id: data.sensorId},
            {
                $push: {
                    temperatures: {
                        _id: data.temperatureId,
                        temperature: data.temperature,
                        collected_at: data.collectedAt
                    }
                }
            },
            {upsert: true, new: true, runValidators: true}, // options
            findOneAndUpdateCallback
        );


        // Send the received data to the analytics module
        kafkaProducer.send([{
            topic: 'analytics',
            messages: JSON.stringify({
                v: data.temperature,
                ts: data.collectedAt,
                sensor: data.sensorId,
                id: data.temperatureId
            })
        }], sendCallback(data.sensorId));


    };
}


/**
 * This function is executed when the server receives a new message from the Kafka broker.
 * Saves the data received in the database.
 * @param message
 */
function processKafkaMessage(message){
    message = JSON.parse(JSON.parse(message.value))['0'];
    console.log("Server: Message received from the analytics module!");

    ModelPrediction.findOneAndUpdate(
        {_id: message.sensor},
        {
            $push: {
                predictions: {
                    _id: message.id,
                    date: message.ds,
                    y_hat: message.yhat,
                    y_hat_lower: message.yhat_lower,
                    y_hat_upper: message.yhat_upper
                }
            }
        },
        {upsert: true, new: true, runValidators: true}, // options
        findOneAndUpdateCallback)

}


/**
 * MQTT subscribe callback function.
 * @param error
 * @param content
 */
function subscribeCallback(error, content){
    if(error){
        console.error(error);
    }
    else{
        console.log(`The server is now subscribed to the temperature topic!`);
    }
}

/**
 * Mongoose findOneAndUpdate callback function.
 * @param err
 * @param doc
 */
function findOneAndUpdateCallback(err, doc){
    if (err) {
        console.error("Couldn't update or create the sensor :/");
        console.error(err);
    }
}


/**
 * Kafka send callback function
 * @param sensorId
 * @return {(function(*, *): void)|*}
 */
function sendCallback(sensorId){
    return (error, result) => {
        if(error){
            console.error(error);
        }
        else{
            console.log('The server has now sent data from the sensor ' + sensorId + ' to the analytics module!' )
        }
    };
}


