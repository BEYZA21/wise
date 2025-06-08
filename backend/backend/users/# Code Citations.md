# Code Citations

## License: unknown

https://github.com/jvnjse/job-kit-django/tree/54c989b7a0009738676ed30046a79969fddf7a5c/jobkitproject/api/views.py

```
, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.
```

## License: unknown

https://github.com/amansohani222/SmartAttendanceSystem/tree/36ecd5583fd054e86a17efb0929ea6b24c037acb/attendance/views.py

```
:
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            login(request, user)
            token, created = Token.objects.get_or_create(user=user
```

## License: unknown

https://github.com/nopsuke/test_platform/tree/a781adc7065b85bfe514d66b88cabc932d3daf97/accounts/views.py

```
)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            login(request, user)
            token, created = Token.objects.get_or_create(user=user)
            return Response({"token": token.key, "message": "
```
