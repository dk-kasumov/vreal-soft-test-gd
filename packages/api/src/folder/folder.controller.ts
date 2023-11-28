import {Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards} from "@nestjs/common";
import {FolderService} from "@/folder/folder.service";
import {Folder, User} from "@prisma/client";
import {CreateFolderDto} from "@/folder/dto/create-folder.dto";
import {UpdateFolderDto} from "@/folder/dto/update-folder.dto";
import {JwtAuthGuard} from "@/@guards/jwt-auth.guard";
import {CurrentUser} from "@/@decorators/current-user.decorator";
import {ParentFolderAccessGuard} from "@/@guards/parent-folder-access.guard";
import {GetFoldersDto} from "@/folder/dto/get-folders.dto";
import {GetFolderDto} from "@/folder/dto/get-folder.dto";
import {CurrentFolderAccessGuard} from "@/@guards/current-folder-access.guard";
import {FolderParamsDto} from "@/folder/dto/folder-params.dto";

@UseGuards(JwtAuthGuard)
@Controller('folders')
export class FolderController {
    constructor(private readonly folderService: FolderService) {}

    @Get()
    async index(@Query() query: GetFoldersDto): Promise<Folder[]> {
        return this.folderService.findMany({
            parentId: query.parentId
        }, {
            access: true
        });
    }

    @Get('all')
    async getAll(): Promise<Folder[]> {
        return this.folderService.findMany()
    }

    @Get(':id')
    async findOne(@Param() query: GetFolderDto): Promise<Folder> {
        return this.folderService.findOne({id: query.id}, {access: true});
    }

    @UseGuards(ParentFolderAccessGuard)
    @Post()
    async create(@Body() payload: CreateFolderDto, @CurrentUser() user: User): Promise<Folder> {
        return this.folderService.create(user, payload);
    }

    @UseGuards(ParentFolderAccessGuard, CurrentFolderAccessGuard)
    @Put(':id')
    async update(@Param() params: FolderParamsDto, @Body() payload: UpdateFolderDto): Promise<Folder> {
        let parentFolder = null;

        if (payload.parentId) {
            parentFolder = await this.folderService.findOne({id: payload.parentId}, {access: true})
        }

        return this.folderService.update(params.id, payload, parentFolder);
    }

    @UseGuards(CurrentFolderAccessGuard)
    @Delete(':id')
    async delete(@Param('id') id: string): Promise<void> {
        return this.folderService.delete(id);
    }
}
