import cv2 as cv

source = "IMG-0518.jpeg"
scale_percent = 50
destination = "image.png"

src = cv.imread(source, cv.IMREAD_UNCHANGED)

new_width = int(src.shape[1] * scale_percent/100)
new_height = int(src.shape[0] * scale_percent/100)

output = cv.resize(src, (new_width,new_height))

cv.imwrite(destination, output)
cv.waitKey(0) 


