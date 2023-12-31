import {Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards} from '@nestjs/common';
import {FolderService} from '@/folder/folder.service';
import {Folder, User} from '@prisma/client';
import {CreateFolderDto} from '@/folder/dto/create-folder.dto';
import {UpdateFolderDto} from '@/folder/dto/update-folder.dto';
import {JwtAuthGuard} from '@/@guards/jwt-auth.guard';
import {CurrentUser} from '@/@decorators/current-user.decorator';
import {ParentFolderAccessGuard} from '@/@guards/parent-folder-access.guard';
import {GetFoldersDto} from '@/folder/dto/get-folders.dto';
import {CurrentFolderAccessGuard} from '@/@guards/current-folder-access.guard';
import {FolderParamsDto} from '@/folder/dto/folder-params.dto';
import {ApiBody, ApiCreatedResponse, ApiOperation, ApiQuery, ApiTags} from "@nestjs/swagger";
import {FolderResponseDto, FolderResponseWithAccessDto} from "@/folder/dto/folder-response.dto";

@ApiTags('Folders')
@UseGuards(JwtAuthGuard)
@Controller('folders')
export class FolderController {
  constructor(private readonly folderService: FolderService) {}

  @ApiOperation({ summary: 'get all of the parent folders that you have access to' })
  @ApiQuery({ name: 'parentId', type: GetFoldersDto })
  @ApiCreatedResponse({
    type: [FolderResponseWithAccessDto],
    description: 'folders response with access',
  })
  @Get()
  async index(@Query() query: GetFoldersDto, @CurrentUser() user: User): Promise<Folder[]> {
    return this.folderService.findMany(
      {
        parentId: query.parentId ?? null,
        OR: [
          {
            access: {
              some: {
                userEmail: user.email
              }
            }
          },
          {
            userId: user.id
          }
        ]
      },
      {access: true}
    );
  }

  @ApiOperation({ summary: 'get all folders that you have access to by search' })
  @ApiQuery({ name: 'name', type: 'string', required: false })
  @ApiCreatedResponse({
    type: [FolderResponseDto],
    description: 'folders response',
  })
  @Get('all')
  async findAll(@Query() query, @CurrentUser() user: User): Promise<Folder[]> {
    return this.folderService.findMany({
      name: {
        contains: query.name,
      },
      OR: [
        {
          userId: user.id
        },
        {
          access: {
            some: {
              userEmail: user.email
            }
          }
        }
      ]
    });
  }

  @ApiOperation({ summary: 'get folder by id' })
  @ApiCreatedResponse({
    type: FolderResponseWithAccessDto,
    description: 'folder`s response',
  })
  @Get(':id')
  async findOne(@Param() param: FolderParamsDto, @CurrentUser() user: User): Promise<Folder> {
    return this.folderService.findOne(
      {
        id: param.id,
        OR: [
          {
            access: {
              some: {
                userEmail: user.email
              }
            }
          },
          {
            userId: user.id
          }
        ]
      },
      {access: true}
    );
  }

  @ApiOperation({ summary: 'create folder' })
  @ApiBody({type: CreateFolderDto})
  @ApiCreatedResponse({
    type: FolderResponseWithAccessDto,
    description: 'folder`s response',
  })
  @UseGuards(ParentFolderAccessGuard)
  @Post()
  async create(@Body() payload: CreateFolderDto, @CurrentUser() user: User): Promise<Folder> {
    if (!payload.parentId) {
      return this.folderService.create(user, payload, []);
    }

    const {access} = await this.folderService.findOne({id: payload.parentId}, {access: true});

    return this.folderService.create(user, payload, access);
  }

  @ApiOperation({ summary: 'update folder' })
  @ApiBody({type: UpdateFolderDto})
  @ApiCreatedResponse({
    type: FolderResponseWithAccessDto,
    description: 'folder`s response',
  })
  @UseGuards(ParentFolderAccessGuard, CurrentFolderAccessGuard)
  @Put(':id')
  async update(@Param() params: FolderParamsDto, @Body() payload: UpdateFolderDto, @CurrentUser() user: User): Promise<Folder> {
    let parentFolder = null;

    if (payload.parentId) {
      parentFolder = await this.folderService.findOne({id: payload.parentId}, {access: true});
    }

    return this.folderService.update(params.id, payload, parentFolder, user);
  }

  @ApiOperation({ summary: 'delete folder' })
  @UseGuards(CurrentFolderAccessGuard)
  @Delete(':id')
  async delete(@Param() params: FolderParamsDto): Promise<void> {
    return this.folderService.delete(params.id);
  }
}
