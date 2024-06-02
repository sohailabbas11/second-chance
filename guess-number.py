import random

def guess (x):
    guess = 0
    random_number = random.randint(1,x)
    while guess != random_number:
        guess = int(input(f"enter your random number between 1 and {x}: "))
        if guess > random_number:
            print("sorry, number is high")        
        elif guess < random_number:
            print("sorry, number is low")     
    print("wow you got it")

guess(10)