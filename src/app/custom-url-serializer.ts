
import { DefaultUrlSerializer, UrlSerializer, UrlTree } from '@angular/router';
import { Injectable } from '@angular/core';

@Injectable()
export default class StandardUrlSerializer extends DefaultUrlSerializer {

    override parse(url: string): UrlTree {
        // Convert URL: /admin/employee to /admin/(main:employee)
        const urlParts = url.split('/');
        if (urlParts.length > 2) {
            const primary = urlParts.slice(0, 2).join('/');
            const aux = urlParts.slice(2).join('/');
            url = `${primary}/(main:${aux})`;
        }
        return super.parse(url);
    }

    override serialize(tree: UrlTree): string {
        // Convert URL: /admin/(main:employee) back to /admin/employee
        const url = super.serialize(tree);
        const editedurl = url.replace(/\/\(main:(.*?)\)/, '/$1');
        console.log(editedurl);
        return editedurl;
    }
}