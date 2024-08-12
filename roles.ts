import { Guild, Role, TextChannel, GuildMember } from 'discord.js';
import { users } from './users';
import { EmbedBuilder } from 'discord.js';

interface RoleDefinition {
    level: number;
    name: string;
    color: string | undefined;
}

const roles: RoleDefinition[] = [
    { level: 5, name: '<☆Ordinary>', color: undefined },
    { level: 10, name: '<✷Notable>', color: '#33FF57' },
    { level: 15, name: '<✿Exceptional>', color: '#506be6' },
    { level: 25, name: '<ᕙElite>', color: '#e4bc42' },
    { level: 35, name: '<๑Prestigious๑>', color: '#e54ced' },
    { level: 50, name: '<ミCelestialミ>', color: '#51eaef' },
];

async function ensureRolesExist(guild: Guild): Promise<void> {
    for (const role of roles) {
        if (!guild.roles.cache.some(r => r.name === role.name)) {
            await guild.roles.create({
                name: role.name,
                color: role.color,
                permissions: [], // Empty array as a placeholder; adjust as necessary
            });
        }
    }
}

async function updateUserRole(message: { guild: Guild; }, channel: TextChannel, userId: string): Promise<boolean> {
    const user = users.loadUserData(userId);
    const userLevel = user.level;
    const member: GuildMember | undefined = message.guild.members.cache.get(userId);

    if (!member) {
        console.error('Member not found');
        return false;
    }

    // Ensure all required roles exist in the guild
    await ensureRolesExist(message.guild);

    const currentRoles = member.roles.cache;
    const rolesToAdd = roles.filter(r => userLevel >= r.level).reverse();
    const newRole = rolesToAdd.length ? rolesToAdd[0].name : null;
    const existingRole = currentRoles.find(role => role.name === newRole);

    // If the user already has the correct role, avoid updating
    if (existingRole && existingRole.name === newRole) {
        return false;
    }

    const rolesToRemove = currentRoles.filter(role => roles.some(r => r.name === role.name));

    let newRoleName: string | undefined;

    try {
        await member.roles.remove(rolesToRemove.map(role => role.id));
        if (newRole) {
            const role = member.guild.roles.cache.find(role => role.name === newRole);
            if (role) {
                await member.roles.add(role);
                user.roles = role.name;
                newRoleName = role.name;
            } else {
                console.error('Role not found in guild:', newRole);
            }
        }
    } catch (error: any) {
        if (error.code === 50013) {
            console.error('Bot lacks permission to manage roles:', error.message);
            await channel.send("I don't have permission to manage roles. Please adjust my permissions or move my role higher.");
        } else {
            console.error('Error updating roles:', error);
        }
    }

    users.saveUserData(userId, user);

    if (newRoleName) {
        const embed = new EmbedBuilder()
            .setTitle(`💫 Congratulations! 🎉 **<@${member.id}>**  💫`)
            .setColor(0x29EF9E)
            .setDescription(`🌟✨  You have been awarded a new role: **${newRoleName}** 🎖️. Keep up the great work! 🚀`);

        await channel.send({ embeds: [embed] });
    }

    return true;
}

export {
    updateUserRole
};