#rename all jpegs in dir with numbers in sequence
import os
def rename(dir):
    filess=[]
    for root, dirs, files in os.walk(dir):
        for file in files:
            if file.endswith(".jpeg"):
                os.rename(file,file[0:2]+".jpeg")

if __name__ == "__main__":
    rename("./")