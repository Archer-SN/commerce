import json
from telnetlib import STATUS

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse

from .models import User, Post, Comment


def index(request):
    posts = Post.objects.all().order_by("-date_created")
    paginator = Paginator(posts, 10)

    page_number = request.GET.get("pnum", 1)
    page_obj = paginator.get_page(page_number)
    if request.user.is_authenticated:
        for obj in page_obj:
            obj.is_liked = request.user.liked_post.filter(pk=obj.id).exists()

    return render(request, "network/index.html", {
        "page_obj": page_obj,
        "title": "All Posts",
        "name": "index"
    })


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")


def error_view(request):
    return render(request, "network/error.html")


def profile_view(request, user_id):

    try:
        user_data = User.objects.get(pk=user_id)
    except:
        return HttpResponseRedirect(reverse("error"))

    if not request.user.is_authenticated:
        is_following = False
    else:
        is_following = request.user.following.filter(id=user_data.id).exists()

    posts = Post.objects.filter(author=user_data)
    paginator = Paginator(posts, 10)

    page_number = request.GET.get("pnum", 1)
    page_obj = paginator.get_page(page_number)
    if request.user.is_authenticated:
        for obj in page_obj:
            obj.is_liked = request.user.liked_post.filter(pk=obj.id).exists()

    return render(request, "network/profile.html", {
        "user_data": user_data,
        "is_following": is_following,
        "page_obj": page_obj,
        "name": "profile"
    })


@login_required
def following_view(request):
    if request.method == "PUT":
        data = json.loads(request.body)
        user_id = data["id"]
        profile_user = User.objects.get(pk=user_id)
        # If the profile doesn't exist
        if not profile_user:
            return HttpResponse(code=401)

        if request.user.following.filter(pk=user_id).exists():
            request.user.following.remove(profile_user)
            return JsonResponse({"button_content": "Follow", "total_followers": profile_user.total_followers}, status=201)
        else:
            request.user.following.add(profile_user)
            return JsonResponse({"button_content": "Unfollow", "total_followers": profile_user.total_followers}, status=201)

    posts = Post.objects.filter(
        author__in=request.user.following.all()).order_by("-date_created")
    paginator = Paginator(posts, 10)

    page_number = request.GET.get("pnum", 1)
    page_obj = paginator.get_page(page_number)
    if request.user.is_authenticated:
        for obj in page_obj:
            obj.is_liked = request.user.liked_post.filter(pk=obj.id).exists()

    return render(request, "network/index.html", {
        "page_obj": page_obj,
        "title": "Following Posts",
        "name": "following"
    })


def comment(request):
    if request.method == "POST":
        if not request.user.is_authenticated:
            return HttpResponse(status=403)

        content = request.POST.get("content", "")
        post_id = request.POST.get("post-id")
        comment_parent = Post.objects.get(pk=post_id)

        if len(content) > 0 and comment_parent:
            new_comment = Comment(author=request.user,
                                  content=content, post=comment_parent)
            new_comment.save()

        # Return to the previous url
        return HttpResponseRedirect(request.META['HTTP_REFERER'])

    elif request.method == "PUT":
        if not request.user.is_authenticated:
            return HttpResponse(status=403)

        data = json.loads(request.body)
        id = data["id"]
        content = data["content"]

        if len(content) <= 0:
            return HttpResponse(status=400)

        comment = Comment.objects.filter(pk=id).first()
        if not comment:
            return HttpResponse(status=404)

        if request.user.id != comment.author.id:
            return HttpResponse(status=403)

        comment.change_content(content)
        comment.save()

        return JsonResponse({"new_content": content}, status=201)

    elif request.method == "GET":
        post_id = request.GET.get("id")
        post = Post.objects.get(pk=post_id)
        comments = list(Comment.objects.filter(
            post=post).order_by("-likes").values())

        # Adding author username to comment array
        for comment in comments:
            comment["author_username"] = User.objects.get(
                pk=comment["author_id"]).username

        return JsonResponse({"comments": comments,
                             "user_id": request.user.id,
                             "is_logged_in": request.user.is_authenticated},
                            status=200)

    else:
        return HttpResponse(status=405)


def post(request):
    if not request.user.is_authenticated:
        return HttpResponse(status=403)

    if request.method == "POST":
        content = request.POST.get("content", "")
        if len(content) > 0:
            new_post = Post(author=request.user, content=content)
            new_post.save()

        return HttpResponseRedirect(reverse("index"))
    elif request.method == "PUT":
        data = json.loads(request.body)
        id = data["id"]
        content = data["content"]

        if len(content) <= 0:
            return HttpResponse(status=400)

        post = Post.objects.filter(pk=id).first()
        if not post:
            return HttpResponse(status=404)

        if request.user.id != post.author.id:
            return HttpResponse(status=403)

        post.change_content(content)
        post.save()

        return JsonResponse({"new_content": content}, status=201)
    else:
        return HttpResponse(status=405)


# Handling like system for both post and like
def like(request):
    if not request.user.is_authenticated:
        return HttpResponse(status=403)

    if request.method == "PUT":
        data = json.loads(request.body)
        id = data["id"]
        type = data["type"]

        if type == "post":
            post = Post.objects.filter(pk=id).first()
            if not post:
                return HttpResponse(status=404)

            # If user has already liked the post, delete the like
            if request.user.liked_post.filter(pk=id).exists():
                post.remove_like()
                request.user.liked_post.remove(post)
                heart_color = "black"
            # Add like if the user hasn't liked the post
            else:
                request.user.liked_post.add(post)
                post.add_like()
                heart_color = "red"
            post.save()
            # Returning like count and color
            return JsonResponse({"like_count": post.likes, "color": heart_color}, status=201)

        elif type == "comment":
            comment = Comment.objects.filter(pk=id).first()
            if not comment:
                return HttpResponse(status=404)

            # If user has already liked the comment, delete the like
            if request.user.liked_comment.filter(pk=id).exists():
                comment.remove_like()
                request.user.liked_comment.remove(comment)
                heart_color = "black"
            # Add like if the user hasn't liked the comment
            else:
                request.user.liked_comment.add(comment)
                comment.add_like()
                heart_color = "red"
            comment.save()
            # Returning like count and color
            return JsonResponse({"like_count": comment.likes, "color": heart_color}, status=201)
    else:
        return HttpResponse(status=405)
