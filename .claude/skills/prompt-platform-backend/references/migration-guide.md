# Alembic 迁移规范

## 初始化

```bash
# 项目初始化时执行一次
cd server
alembic init alembic
```

## alembic.ini 关键配置

```ini
[alembic]
script_location = alembic
sqlalchemy.url = mysql+aiomysql://user:password@localhost:3306/prompt_engineering
```

## env.py 异步配置

```python
from alembic import context
from sqlalchemy.ext.asyncio import async_engine_from_config
import asyncio
from app.models.base import Base
# 导入所有模型确保 autogenerate 能检测到
from app.models import *  # noqa

config = context.config

async def run_migrations_async():
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
    )
    async with connectable.connect() as connection:
        await connection.run_sync(
            lambda conn: context.configure(
                connection=conn, target=Base.metadata
            )._do_run_migrations()
        )

def run_migrations_online():
    asyncio.run(run_migrations_async())

run_migrations_online()
```

## 常用命令

```bash
# 生成迁移脚本
alembic revision --autogenerate -m "create prompt_templates table"

# 执行迁移到最新
alembic upgrade head

# 回滚一个版本
alembic downgrade -1

# 查看当前版本
alembic current

# 查看历史
alembic history
```

## 规范

1. 迁移消息用英文，简短描述变更（如 "create prompt_templates table"）
2. 每次迁移只包含一组相关的表变更
3. 新增列必须有默认值或允许 NULL
4. 删除列前确认无外键依赖
5. 迁移脚本要可回滚（upgrade 和 downgrade 都要实现）
6. 不要手动编辑已执行过的迁移脚本，新建一个修正迁移