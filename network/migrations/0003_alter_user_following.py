# Generated by Django 4.0.4 on 2022-04-26 06:40

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('network', '0002_user_following_post_comment'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='following',
            field=models.ManyToManyField(blank=True, null=True, related_name='follower', to=settings.AUTH_USER_MODEL),
        ),
    ]
