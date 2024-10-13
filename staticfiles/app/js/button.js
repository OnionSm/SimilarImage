
function updateFileName() 
{
    const fileInput = document.getElementById('file-upload'); 
    console.log(fileInput); 

    if (fileInput && fileInput.files.length > 0) 
    {
        console.log(fileInput.files[0]);
        const fileName = fileInput.files[0].name;
        console.log(fileName);

        const fileSizeInBytes = fileInput.files[0].size; 
        const fileSizeInKB = (fileSizeInBytes / 1024).toFixed(2); 
        const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2);
        console.log(fileSizeInKB);

        if(fileSizeInMB > 20)
        {
            fileInput.value = "";
            alert('Độ lón ảnh không được vượt quá 20MB!');
            return;
        }
        const fileType = fileInput.files[0].type;
        if (fileType !== "image/jpeg" && fileType !== "image/png" && fileType !== "image/jpg") 
        {
            fileInput.value = "";  
            alert('Chỉ hỗ trợ ảnh có các định dạng JPG, JPEG, PNG!');
            return; 
        }

        const fileInfo = document.getElementsByClassName('file_info')[0]; 
        fileInfo.style.display = 'flex'; 

        const fileInfoElement = document.getElementsByClassName('file_info_size')[0];
        if (fileInfoElement) 
        {
            fileInfoElement.textContent = `Kích thước: ${fileSizeInKB} KB`;
        } 
        else 
        {
            console.error('Phần tử không tìm thấy!');
        }

        document.getElementsByClassName('file_info_name')[0].textContent = fileName; 
        updateImageDisplay(fileInput.files[0]);
    }
}
function showImage() 
{
    var imgElement = document.getElementById('dynamicImage');
    imgElement.src = 'path/to/your/image.jpg'; 
}
function updateImageDisplay(inputElement) 
{
    const imageElement = document.getElementById('dynamicImage');

    if (inputElement !== undefined) 
    {
        const file = inputElement;
        const imageUrl = URL.createObjectURL(file);

        imageElement.src = imageUrl;
        
        imageElement.style.display = 'block';
    }
}

function Execute() {
    const fileInput = document.getElementById('file-upload');
    const file = fileInput.files[0];

    const numberImageInput = document.getElementById('number_similar_image');
    const numberImage = parseInt(numberImageInput.value);
    console.log(numberImageInput);

    const distanceType = document.getElementsByClassName('selected')[0].innerText.toLowerCase();
    console.log(distanceType);
    const dataPath = document.getElementById('seg_data_path').value;

    if (!file) {
        alert('Vui lòng chọn ảnh trước!');
        return;
    }

    if (numberImage <= 0 || isNaN(numberImage)) {
        alert('Vui lòng nhập số ảnh cần tìm!');
        return;
    }

    if (dataPath === "") {
        alert('Vui lòng nhập đường dẫn thư mục truy vấn!');
        return;
    }

    console.log(file.name);

    const formData = new FormData();
    formData.append('image', file);
    formData.append('number_similar_image', numberImage);
    formData.append('data_path', dataPath);
    formData.append('distance_type', distanceType);

    // Gửi ảnh đến server qua fetch
    fetch('/upload-image/', {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
        }
    })
    .then(response => 
    {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json(); 
    })
    .then(data => 
    {
        if (data.success) {
            console.log("Get dữ liệu thành công");
            const Top_similar_image = document.getElementsByClassName('Top_similar_image')[0];
            Top_similar_image.innerHTML = '';
            Top_similar_image.style.display = 'flex';
        
            const numberOfImages = data.images.length; // Lấy số phần tử của mảng images
            console.log(`Số lượng hình ảnh: ${numberOfImages}`);
            console.log(data.distance_response);
            for (let index = 0; index < numberOfImages; index++) {
                const imgBase64 = data.images[index]; 
                // const h3_text = data.distance_response[index];
                // const h32_text = data.labels[index];
                const img = document.createElement('img');
                const div = document.createElement('div');
                const h3 = document.createElement('h3');
                const h32 = document.createElement('h3');
        
                div.style.cssText = "display: flex; justify-content: flex-start; align-items: center; flex-direction: column; width: 21.5%; height: auto; border-radius: 10px;";
                h3.style.cssText = "font-size: 12px; color: #fff; font-family: 'Genshin2', 'sans-serif';";
                h32.style.cssText = "font-size: 12px; color: #fff; font-family: 'Genshin2', 'sans-serif';";
                img.style.cssText = "width: 100%; height: auto; border-radius: 10px;";
        
                img.src = `data:image/png;base64,${imgBase64}`;
                console.log("Img ok");
        
                // h3.textContent = `Similarity: ${h3_text}`; // Sử dụng distance_response
                // console.log("h3 ok");
                // h32.textContent = `Label: ${h32_text}`; // Sử dụng labels
                // console.log("h32 ok");
        
                div.appendChild(img);
                div.appendChild(h3);
                div.appendChild(h32);
                console.log("ok ok");
        
                Top_similar_image.appendChild(div);
            }
        } 
        else {
            console.error('Upload failed:', data.error);
            alert('Upload thất bại: ' + data.error); 
        }
        
    })
    .catch(error => 
    {
        console.error('Error:', error);
        alert('Có lỗi xảy ra: ' + error.message); 
    });
}


function getCookie(name) 
{
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') 
    {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) 
        {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) 
            {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function cancelFileUpload()
{
    document.getElementById('file-upload').value = "";
    const fileInfo = document.getElementsByClassName('file_info')[0]; 
    fileInfo.style.display = 'none'; 
    document.getElementById('dynamicImage').style.display = "none"
    console.log("File upload canceled.");
}


