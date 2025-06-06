#!/bin/bash
pip install gdown
mkdir-p backend/yolov5/weights
gdown --id 1Tjp3Ga2b2IIMuiKSjMbWV_8o2PASQzwW -O backend/yolov5/weights/wisePlate.pt
gdown --id 1sbHqVBvtlFhYksyCV6YA7QK_DinlXnQR -O backend/yolov5/weights/wiseTypeSoup.pt
gdown --id 1BJjsNDfe5pqn1Btd-CVs03RaU8GGAfqu -O backend/yolov5/weights/wiseSoup.pt
gdown --id 181OutK-60HKy0WT-mDOvZOKkjjrM9sjK -O backend/yolov5/weights/wiseMainTypeCls-yolo5.pt
gdown --id 1QFNkEMPoCB0ZEF5wq2sp5v1G1fmoNXnZ -O backend/yolov5/weights/wiseSideTypeCls-yolo5.pt  
gdown --id 1uWRaVV46g-OdTFHLBExboWamBybzD-YL -O backend/yolov5/weights/wiseSideCls-yolo5.pt  
gdown --id 1gEuh7AEqqk5gMvEsdftnwhu4tXDfKxSS -O backend/yolov5/weights/wiseExtraTypeCls-yolo5.pt 
gdown --id 1TfzrpbpdM5XM210Jzuk-q96UTgngMrd4 -O backend/yolov5/weights/wiseExtraCls-yolo5-yolo5.pt
gdown --id 1vXG5fjcJhaAwsFMp-xE0udCu_UQZhC4h -O backend/yolov5/weights/wiseMainCls-yolo5-yolo5.pt 
 
# Ardından Django'yu başlat
gunicorn config.wsgi:application
