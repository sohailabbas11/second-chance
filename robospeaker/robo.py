import os

if __name__ == "__main__":
    print('Welcome to robo speaker')
    while True:
        x = input('Write what you want me to speak: ')
        if x == "q":
            os.system("say 'bye friend'")
            break
        command = f"say {x}"
        os.system(command)