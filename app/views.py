from django.http import JsonResponse
from django.shortcuts import render
from PIL import Image
import io
import numpy as np
import base64
import traceback
import cv2
import pandas as pd
from sklearn.preprocessing import Normalizer
import os
from django.views.decorators.csrf import csrf_exempt

def convert_numpy_to_base64(np_array):
    try:
        image = Image.fromarray(np_array.astype('uint8')) 
        if image.mode in ('RGBA', 'P'): 
            image = image.convert('RGB')
    
        img_byte_arr = io.BytesIO()
        image.save(img_byte_arr, format='JPEG')
        img_byte_arr = img_byte_arr.getvalue()
        return base64.b64encode(img_byte_arr).decode('utf-8')
    
    except Exception as e:
        print(f"Error converting NumPy array to base64: {e}")
        raise

@csrf_exempt
def upload_image(request):
    if request.method == 'POST':
        print("Received POST request for image upload.")

        if 'image' not in request.FILES:
            return JsonResponse({'success': False, 'error': 'No image found in request'}, status=400)

        image_file = request.FILES['image']
        distance_type = request.POST.get('distance_type')
        data_path = request.POST.get('data_path')
        number_similar_image = request.POST.get('number_similar_image')         
        print(f"Uploading image: {image_file.name}")

        try:
            image = Image.open(image_file)
            print("Image opened successfully.")

            img_array = np.array(image)
            print("Converted image to NumPy array.")

            test_image_hist = histogram_features(img_array)
            print(test_image_hist.shape)

            csv_file_path = 'app/dataset/seg.csv'  
            seg_df = pd.read_csv(csv_file_path, header=None)

            seg_data = []
            for row in seg_df.itertuples():
                row_values = np.array(list(row[1:769]))
                seg_data.append([row[769], row[-1], row_values]) 
            
            number_similar_image = int(number_similar_image)
            map_image_distance = {}
            for index, item in enumerate(seg_data):
                distance = calculate_hist_distance(test_image_hist, item[2], distance_type)
                map_image_distance[index] = distance

            closest_images = get_closest_images(map_image_distance, distance_type, n=number_similar_image)
            image_response = []
            distance_response = []
            labels = []

            for idx, dist in closest_images:
                img = read_image(os.path.join(data_path, seg_data[idx][1], seg_data[idx][0]))
                img = convert_numpy_to_base64(img)
                image_response.append(img)
                distance_response.append(dist)
                labels.append(seg_data[idx][1])

            print(distance_response)
            print("Images converted to base64 successfully.")
            print(type(distance_response))
            # Trả về các ảnh đã xử lý dưới dạng JSON
            return JsonResponse({
                'success': True,
                'message': 'Image processed successfully',
                'images': image_response,
                'distances': distance_response,
                'labels': labels,
            })

        except Exception as e:
            print(f"Error processing image: {traceback.format_exc()}")
            return JsonResponse({'success': False, 'error': f"Error processing image: {e}"}, status=500)
    return render(request, 'app/index.html')

def main_web(request):
    return render(request, 'app/index.html')

def histogram_features(image):
    normalizer = Normalizer()
    hist_list = []
    for i in range(3): 
        hist = cv2.calcHist([image], [i], None, [256], [0, 256])  
        hist_list.append(hist)  
    hist = np.concatenate(hist_list)
    hist = normalizer.fit_transform(hist.reshape(1, -1)).flatten()

    return hist

def calculate_hist_distance(hist1, hist2, distance_type):
    hist1 = hist1.astype('float32')
    hist2 = hist2.astype('float32')
    if distance_type == "euclidean":
        return cv2.norm(hist1, hist2, cv2.NORM_L2)
    elif distance_type == "correlation":
        return cv2.compareHist(hist1, hist2, cv2.HISTCMP_CORREL)
    elif distance_type == "chi-square":
        return cv2.compareHist(hist1, hist2, cv2.HISTCMP_CHISQR)
    elif distance_type == "intersection":
        return cv2.compareHist(hist1, hist2, cv2.HISTCMP_INTERSECT)
    elif distance_type == "bhattacharyya":
        return cv2.compareHist(hist1, hist2, cv2.HISTCMP_BHATTACHARYYA)
    
def get_closest_images(map_image_distance, distance_type, n=10):
    if distance_type in ["euclidean", "chi-square", "bhattacharyya"]: 
        closest_images = sorted(map_image_distance.items(), key=lambda item: item[1])[:n]
    elif distance_type in ["correlation", "intersection"]:
        closest_images = sorted(map_image_distance.items(), key=lambda item: item[1], reverse=True)[:n]
    
    return closest_images

def read_image(img):
    img = Image.open(img).convert("RGB")
    img_array = np.array(img)
    return img_array