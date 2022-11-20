from pickle import load
from kafka import KafkaConsumer, KafkaProducer
import pandas as pd
from prophet import Prophet
from datetime import datetime
from json import loads, dumps

my_consumer = KafkaConsumer(
    'analytics',
    bootstrap_servers=['kafka:9092'],
    auto_offset_reset='latest',
    enable_auto_commit=True,
    group_id='analytics-group',
    value_deserializer=lambda x: loads(x.decode('utf-8'))
)
my_producer = KafkaProducer(
    bootstrap_servers=['kafka:9092'],
    value_serializer=lambda x: dumps(x).encode('utf-8')
)
m = load(open("model_trained.pkl", "rb"))

print("starting")

for message in my_consumer:
    print(f"{message} is being processed")
    message = message.value
    df_pred = pd.DataFrame.from_records([{"ds": message['ts']}])
    df_pred['ds'] = pd.to_datetime(df_pred['ds'])
    forecast = m.predict(df_pred)
    forecast['sensor'] = message['sensor']
    forecast['id'] = message['id']
    my_producer.send('analytics_results',
                     value= forecast[['id', 'ds', 'yhat', 'yhat_lower', 'yhat_upper', 'sensor']].to_json(orient="index", date_format='iso'))
    print(forecast[['id', 'ds', 'yhat', 'yhat_lower', 'yhat_upper', 'sensor']].to_json(orient="index", date_format='iso'))
